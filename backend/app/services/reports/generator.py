import io
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

from app.models.test import Test
from app.services.compliance.checker import OIMLComplianceChecker


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to calculate total page count and render professional footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 42, 555, 42)

        # Footer Left: Standard reference
        self.drawString(40, 30, "OIML R 76-1:2006 (E) Standard Metrology Verification Report")

        # Footer Center: Page X of Y
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawCentredString(297, 30, page_str)

        # Footer Right: Confidentiality notice
        self.drawRightString(555, 30, "Official Lab Certificate • NAWI System")

        self.restoreState()


class ReportGenerator:
    """
    Engine for compiling frozen test data snapshots and rendering
    standardized legal metrology PDF certificates according to OIML R-76.
    """

    @classmethod
    def compile_report_data(
        cls,
        test: Test,
        summary_remarks: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compiles the full immutable snapshot of the test, instrument,
        environmental conditions, raw observations, and compliance outcomes.
        Returns a dict containing 'data', 'checksum', and 'overall_verdict'.
        """
        instrument = test.instrument
        env = test.environmental_condition

        # Execute compliance checker for comprehensive evaluation matrix
        compliance_summary = OIMLComplianceChecker.check_test_compliance(test)

        # Build procedure snapshot
        procedures_payload = []
        for instance in test.test_instances:
            definition = instance.definition
            results = instance.results
            latest_result = results[0] if results else None

            calc_data = {}
            if latest_result and latest_result.calculated_values_json:
                try:
                    calc_data = json.loads(latest_result.calculated_values_json)
                except Exception:
                    calc_data = {}

            # Gather raw observations
            obs_list = []
            for obs in instance.observations:
                obs_list.append({
                    "sequence_order": obs.sequence_order,
                    "load_point": obs.load_point,
                    "indicated_value": obs.indicated_value,
                    "extra_load_added": obs.extra_load_added,
                    "zero_indicated": obs.zero_indicated,
                    "tare_applied": obs.tare_applied,
                    "position_label": obs.position_label,
                    "notes": obs.notes
                })

            procedures_payload.append({
                "definition_code": definition.code,
                "definition_name": definition.name,
                "clause_reference": definition.clause_reference,
                "verdict": latest_result.verdict if latest_result else "INCOMPLETE",
                "explanation": latest_result.explanation if latest_result else "Not evaluated",
                "calculated_values": calc_data,
                "observations": obs_list
            })

        report_dict: Dict[str, Any] = {
            "metadata": {
                "system_name": "NAWI Legal Metrology Compliance System",
                "standard": "OIML R 76-1:2006 (E)",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "test_id_str": test.test_id,
                "test_date": (test.started_at or test.created_at).strftime("%Y-%m-%d") if (getattr(test, "started_at", None) or getattr(test, "created_at", None)) else datetime.now().strftime("%Y-%m-%d"),
                "status": test.status.value if hasattr(test.status, "value") else str(test.status),
                "tester_name": getattr(test.tester, "name", getattr(test.tester, "full_name", "N/A")) if test.tester else "N/A",
                "reviewer_name": getattr(test.reviewer, "name", getattr(test.reviewer, "full_name", "Pending Review")) if test.reviewer else "Pending Review",

                "laboratory_name": test.laboratory_name or "National Metrology Testing Center",
                "laboratory_location": env.test_location if env and env.test_location else "Metrology Laboratory",
                "remarks": summary_remarks or test.remarks or ""
            },

            "instrument": {
                "instrument_id": instrument.instrument_id,
                "manufacturer": instrument.manufacturer,
                "model": instrument.model,
                "serial_number": instrument.serial_number,
                "accuracy_class": instrument.accuracy_class,
                "max_capacity": getattr(instrument, "maximum_capacity", getattr(instrument, "max_capacity", 0.0)),
                "min_capacity": getattr(instrument, "minimum_capacity", getattr(instrument, "min_capacity", 0.0)),
                "scale_interval_d": getattr(instrument, "scale_interval_d", instrument.verification_scale_interval),
                "verification_scale_interval_e": instrument.verification_scale_interval,
                "tare_capacity": getattr(instrument, "tare_capacity", 0.0),
                "n_intervals": round(getattr(instrument, "maximum_capacity", getattr(instrument, "max_capacity", 0.0)) / instrument.verification_scale_interval) if instrument.verification_scale_interval else 0,
                "unit": "g" if instrument.accuracy_class in ["Class I", "Class II"] and getattr(instrument, "maximum_capacity", 0.0) <= 5000 else "kg"
            },

            "environmental_conditions": {
                "temperature_celsius": env.temperature_celsius if env else None,
                "relative_humidity_percent": env.relative_humidity_percent if env else None,
                "atmospheric_pressure_kpa": env.atmospheric_pressure_kpa if env else None,
                "start_time": env.start_time.isoformat() if env and env.start_time else None,
                "end_time": env.end_time.isoformat() if env and env.end_time else None,
                "reference_standards": env.reference_standards if env else "Standard OIML E2/F1 weights",
                "remarks": env.remarks if env else None
            },
            "compliance_summary": compliance_summary,
            "procedures": procedures_payload
        }

        # Deterministic JSON canonical string for SHA-256 calculation
        canonical_json = json.dumps(report_dict, sort_keys=True, separators=(',', ':'))
        checksum = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

        report_dict["checksum_hash"] = checksum

        return {
            "data": report_dict,
            "checksum": checksum,
            "overall_verdict": compliance_summary.get("overall_status", "REVIEW")
        }

    @classmethod
    def generate_pdf(cls, report_data: Dict[str, Any], output_path: Optional[str] = None) -> bytes:
        """
        Renders a standardized, high-fidelity A4 legal metrology test certificate
        using ReportLab. Returns PDF binary bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=40,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0F172A'),
            alignment=1, # Center
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            'CertSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#2563EB'),
            alignment=1,
            spaceAfter=15
        )

        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#334155')
        )

        bold_style = ParagraphStyle(
            'BoldBody',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        story = []

        meta = report_data.get("metadata", {})
        inst = report_data.get("instrument", {})
        env = report_data.get("environmental_conditions", {})
        comp = report_data.get("compliance_summary", {})
        procs = report_data.get("procedures", [])
        checksum = report_data.get("checksum_hash", "")
        verdict = comp.get("overall_status", "REVIEW")

        # 1. Header / Letterhead
        story.append(Paragraph("NATIONAL LEGAL METROLOGY LABORATORY", title_style))
        story.append(Paragraph(
            "OFFICIAL VERIFICATION CERTIFICATE & TEST REPORT &bull; OIML R 76-1:2006",
            subtitle_style
        ))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=12))

        # 2. Certificate Meta & Verdict Banner
        verdict_color = colors.HexColor("#10B981") if verdict == "PASS" else (
            colors.HexColor("#EF4444") if verdict == "FAIL" else colors.HexColor("#F59E0B")
        )

        meta_table_data = [
            [
                Paragraph(f"<b>Test Report ID:</b> {meta.get('test_id_str', 'N/A')}", body_style),
                Paragraph(f"<b>Date of Test:</b> {meta.get('test_date', 'N/A')}", body_style),
                Paragraph(f"<b>Overall Verdict:</b> <font color='{verdict_color.hexval()}'><b>{verdict}</b></font>", bold_style)
            ],
            [
                Paragraph(f"<b>Laboratory:</b> {meta.get('laboratory_name', 'N/A')}", body_style),
                Paragraph(f"<b>Tester:</b> {meta.get('tester_name', 'N/A')}", body_style),
                Paragraph(f"<b>Reviewer:</b> {meta.get('reviewer_name', 'Pending')}", body_style)
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[180, 180, 155])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # 3. Instrument Specifications
        story.append(Paragraph("1. INSTRUMENT UNDER TEST (EUT)", section_heading))
        unit = inst.get("unit", "kg")
        inst_table_data = [
            [
                Paragraph(f"<b>Instrument ID:</b> {inst.get('instrument_id')}", body_style),
                Paragraph(f"<b>Manufacturer:</b> {inst.get('manufacturer')}", body_style),
                Paragraph(f"<b>Model:</b> {inst.get('model')}", body_style),
                Paragraph(f"<b>Serial No.:</b> {inst.get('serial_number')}", body_style),
            ],
            [
                Paragraph(f"<b>Accuracy Class:</b> <b>{inst.get('accuracy_class')}</b>", body_style),
                Paragraph(f"<b>Max Capacity:</b> {inst.get('max_capacity')} {unit}", body_style),
                Paragraph(f"<b>Min Capacity:</b> {inst.get('min_capacity')} {unit}", body_style),
                Paragraph(f"<b>Interval (e):</b> {inst.get('verification_scale_interval_e')} {unit}", body_style),
            ],
            [
                Paragraph(f"<b>Interval (d):</b> {inst.get('scale_interval_d')} {unit}", body_style),
                Paragraph(f"<b>Tare Capacity:</b> {inst.get('tare_capacity', 0)} {unit}", body_style),
                Paragraph(f"<b>Verification Intervals (n):</b> {inst.get('n_intervals')}", body_style),
                Paragraph(f"<b>Classification:</b> OIML R 76 NAWI", body_style),
            ]
        ]
        inst_table = Table(inst_table_data, colWidths=[130, 130, 130, 125])
        inst_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(inst_table)
        story.append(Spacer(1, 10))

        # 4. Laboratory Conditions
        story.append(Paragraph("2. ENVIRONMENTAL & LABORATORY CONDITIONS", section_heading))
        temp = f"{env.get('temperature_celsius')} &deg;C" if env.get('temperature_celsius') is not None else "N/A"
        hum = f"{env.get('relative_humidity_percent')} %" if env.get('relative_humidity_percent') is not None else "N/A"
        press = f"{env.get('atmospheric_pressure_kpa')} kPa" if env.get('atmospheric_pressure_kpa') is not None else "N/A"

        env_table_data = [
            [
                Paragraph(f"<b>Temperature:</b> {temp}", body_style),
                Paragraph(f"<b>Relative Humidity:</b> {hum}", body_style),
                Paragraph(f"<b>Pressure:</b> {press}", body_style),
            ],
            [
                Paragraph(f"<b>Test Location:</b> {env.get('test_location') or 'Lab Room 1'}", body_style),
                Paragraph(f"<b>Reference Standards:</b> {env.get('reference_standards') or 'Standard Weights'}", body_style),
                Paragraph(f"<b>Standard Range:</b> 10&deg;C &ndash; 30&deg;C (Class III/IIII)", body_style),
            ]
        ]
        env_table = Table(env_table_data, colWidths=[170, 175, 170])
        env_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(env_table)
        story.append(Spacer(1, 10))

        # 5. OIML Compliance Summary Matrix
        story.append(Paragraph("3. OIML R-76 COMPLIANCE EVALUATION SUMMARY", section_heading))
        comp_rows = [
            [
                Paragraph("<b>Test Procedure</b>", bold_style),
                Paragraph("<b>OIML Clause</b>", bold_style),
                Paragraph("<b>Points</b>", bold_style),
                Paragraph("<b>Max Deviation</b>", bold_style),
                Paragraph("<b>Permissible Limit</b>", bold_style),
                Paragraph("<b>Verdict</b>", bold_style)
            ]
        ]

        for p_comp in comp.get("procedures", []):
            p_verd = p_comp.get("verdict", "REVIEW")
            verd_color = "#10B981" if p_verd == "PASS" else ("#EF4444" if p_verd == "FAIL" else "#F59E0B")
            max_dev = p_comp.get("max_deviation_found")
            max_dev_str = f"{max_dev:.4f}" if isinstance(max_dev, (int, float)) else "N/A"
            limit_str = f"&le; {p_comp.get('permissible_limit_e')} e" if p_comp.get('permissible_limit_e') else "Formula"

            comp_rows.append([
                Paragraph(p_comp.get("definition_name", ""), body_style),
                Paragraph(p_comp.get("clause_reference", ""), body_style),
                Paragraph(str(p_comp.get("total_points_evaluated", 0)), body_style),
                Paragraph(max_dev_str, body_style),
                Paragraph(limit_str, body_style),
                Paragraph(f"<font color='{verd_color}'><b>{p_verd}</b></font>", bold_style)
            ])

        comp_table = Table(comp_rows, colWidths=[150, 110, 50, 80, 75, 50])
        comp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(comp_table)
        story.append(Spacer(1, 10))

        # 6. Detailed Procedure Observations & Metrological Calculation Breakdown
        story.append(Paragraph("4. OBSERVATIONS & ERROR CALCULATIONS BREAKDOWN", section_heading))

        for p_idx, proc in enumerate(procs, start=1):
            p_name = proc.get("definition_name")
            p_clause = proc.get("clause_reference")
            p_verd = proc.get("verdict", "REVIEW")
            p_verd_color = "#10B981" if p_verd == "PASS" else ("#EF4444" if p_verd == "FAIL" else "#F59E0B")
            obs_list = proc.get("observations", [])
            calc = proc.get("calculated_values", {})

            proc_elements = []
            proc_elements.append(Paragraph(
                f"<b>4.{p_idx} {p_name} ({p_clause}) &mdash; <font color='{p_verd_color}'>{p_verd}</font></b>",
                bold_style
            ))

            if not obs_list:
                proc_elements.append(Paragraph("<i>No observation records captured for this procedure.</i>", body_style))
            else:
                p_code = proc.get("definition_code", "").upper()
                if "ECC" in p_code:
                    # Eccentricity Table
                    pt_rows = [
                        [
                            Paragraph("<b>Pos</b>", bold_style),
                            Paragraph(f"<b>Load ({unit})</b>", bold_style),
                            Paragraph(f"<b>Reading I ({unit})</b>", bold_style),
                            Paragraph(f"<b>&Delta;L ({unit})</b>", bold_style),
                            Paragraph(f"<b>Calc P ({unit})</b>", bold_style),
                            Paragraph(f"<b>Error E ({unit})</b>", bold_style),
                            Paragraph(f"<b>Ec ({unit})</b>", bold_style),
                            Paragraph("<b>MPE</b>", bold_style),
                            Paragraph("<b>Status</b>", bold_style),
                        ]
                    ]
                    e_e = inst.get("verification_scale_interval_e", 1.0)
                    for pt in obs_list:
                        l = pt.get("load_point", 0.0)
                        i = pt.get("indicated_value", 0.0)
                        dl = pt.get("extra_load_added", 0.0)
                        p_val = i + 0.5 * e_e - dl
                        err = p_val - l
                        err_c = err  # Corrected for center if applicable
                        pt_rows.append([
                            Paragraph(pt.get("position_label") or "P", body_style),
                            Paragraph(f"{l:.3f}", body_style),
                            Paragraph(f"{i:.3f}", body_style),
                            Paragraph(f"{dl:.4f}", body_style),
                            Paragraph(f"{p_val:.4f}", body_style),
                            Paragraph(f"{err:+.4f}", body_style),
                            Paragraph(f"{err_c:+.4f}", body_style),
                            Paragraph(f"&plusmn;{calc.get('mpe', e_e):.3f}", body_style),
                            Paragraph(f"<font color='{p_verd_color}'><b>{p_verd}</b></font>", bold_style),
                        ])
                    t = Table(pt_rows, colWidths=[55, 60, 60, 55, 60, 60, 60, 55, 50])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                        ('TOPPADDING', (0, 0), (-1, -1), 3),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ]))
                    proc_elements.append(t)

                elif "REP" in p_code:
                    # Repeatability Table
                    pt_rows = [
                        [
                            Paragraph("<b>Run #</b>", bold_style),
                            Paragraph(f"<b>Load ({unit})</b>", bold_style),
                            Paragraph(f"<b>Zero I<sub>0</sub></b>", bold_style),
                            Paragraph(f"<b>Indication I ({unit})</b>", bold_style),
                            Paragraph(f"<b>&Delta;L ({unit})</b>", bold_style),
                            Paragraph(f"<b>Calc P ({unit})</b>", bold_style),
                            Paragraph(f"<b>Error E ({unit})</b>", bold_style),
                        ]
                    ]
                    e_e = inst.get("verification_scale_interval_e", 1.0)
                    for pt in obs_list:
                        l = pt.get("load_point", 0.0)
                        i = pt.get("indicated_value", 0.0)
                        dl = pt.get("extra_load_added", 0.0)
                        z = pt.get("zero_indicated", 0.0)
                        p_val = i + 0.5 * e_e - dl
                        err = p_val - l
                        pt_rows.append([
                            Paragraph(str(pt.get("sequence_order")), body_style),
                            Paragraph(f"{l:.3f}", body_style),
                            Paragraph(f"{z:.3f}", body_style),
                            Paragraph(f"{i:.3f}", body_style),
                            Paragraph(f"{dl:.4f}", body_style),
                            Paragraph(f"{p_val:.4f}", body_style),
                            Paragraph(f"{err:+.4f}", body_style),
                        ])
                    t = Table(pt_rows, colWidths=[50, 75, 75, 75, 75, 85, 80])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                        ('TOPPADDING', (0, 0), (-1, -1), 3),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ]))
                    proc_elements.append(t)
                    if "max_difference" in calc:
                        diff_text = f"Max Indication Difference: <b>{calc['max_difference']:.4f} {unit}</b> &bull; Permissible: <b>{calc.get('mpe', 0.0):.4f} {unit}</b>"
                        proc_elements.append(Paragraph(diff_text, body_style))

                else:
                    # Generic / Weighing Performance Table
                    pt_rows = [
                        [
                            Paragraph("<b>#</b>", bold_style),
                            Paragraph(f"<b>Load ({unit})</b>", bold_style),
                            Paragraph(f"<b>Reading I ({unit})</b>", bold_style),
                            Paragraph(f"<b>&Delta;L ({unit})</b>", bold_style),
                            Paragraph(f"<b>Calc P ({unit})</b>", bold_style),
                            Paragraph(f"<b>Error E ({unit})</b>", bold_style),
                            Paragraph(f"<b>Ec ({unit})</b>", bold_style),
                            Paragraph("<b>MPE</b>", bold_style),
                        ]
                    ]
                    e_e = inst.get("verification_scale_interval_e", 1.0)
                    for pt in obs_list:
                        l = pt.get("load_point", 0.0)
                        i = pt.get("indicated_value", 0.0)
                        dl = pt.get("extra_load_added", 0.0)
                        p_val = i + 0.5 * e_e - dl
                        err = p_val - l
                        err_c = err
                        pt_rows.append([
                            Paragraph(str(pt.get("sequence_order")), body_style),
                            Paragraph(f"{l:.3f}", body_style),
                            Paragraph(f"{i:.3f}", body_style),
                            Paragraph(f"{dl:.4f}", body_style),
                            Paragraph(f"{p_val:.4f}", body_style),
                            Paragraph(f"{err:+.4f}", body_style),
                            Paragraph(f"{err_c:+.4f}", body_style),
                            Paragraph(f"&plusmn;{calc.get('mpe', e_e):.3f}", body_style),
                        ])
                    t = Table(pt_rows, colWidths=[35, 75, 75, 65, 75, 65, 65, 60])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                        ('TOPPADDING', (0, 0), (-1, -1), 3),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ]))
                    proc_elements.append(t)

            proc_elements.append(Spacer(1, 8))
            story.append(KeepTogether(proc_elements))

        # 7. Summary Remarks & Integrity Hash
        story.append(Paragraph("5. SUMMARY REMARKS & METROLOGICAL STATEMENT", section_heading))
        remarks_text = meta.get("remarks") or (
            "The instrument under test was evaluated in accordance with OIML Recommendation R 76-1 (Edition 2006). "
            f"The verification test resulted in an overall verdict of <b>{verdict}</b>."
        )
        story.append(Paragraph(remarks_text, body_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>Tamper-Evident SHA-256 Checksum:</b> <font face='Courier'>{checksum}</font>", body_style))
        story.append(Spacer(1, 15))

        # 8. Signatures Block
        sign_table_data = [
            [
                Paragraph("<b>TEST CONDUCTED BY</b>", bold_style),
                Paragraph("<b>VERIFIED & APPROVED BY</b>", bold_style),
                Paragraph("<b>OFFICIAL LABORATORY STAMP</b>", bold_style)
            ],
            [
                Paragraph(f"<br/><br/>____________________________<br/><b>{meta.get('tester_name', 'Tester')}</b><br/>Authorized Metrology Tester", body_style),
                Paragraph(f"<br/><br/>____________________________<br/><b>{meta.get('reviewer_name', 'Metrology Officer')}</b><br/>Lead Metrologist / Reviewer", body_style),
                Paragraph("<br/><br/>[ ACCREDITED LAB SEAL ]<br/>ISO/IEC 17025 Compliant", body_style)
            ]
        ]
        sign_table = Table(sign_table_data, colWidths=[175, 175, 165])
        sign_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(KeepTogether([sign_table]))

        # Build document
        doc.build(story, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        if output_path:
            with open(output_path, "wb") as f:
                f.write(pdf_bytes)

        return pdf_bytes
