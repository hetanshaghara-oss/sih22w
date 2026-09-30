import os
import subprocess
import wave

AUDIO_DIR = r"D:\NAWI-System\media\audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

SCENES = [
    {
        "id": "scene1",
        "target_duration": 38.0,
        "text": (
            "Welcome to the NAWI Testing and Legal Metrology Compliance Platform. "
            "In verification laboratories, certifying Non-Automatic Weighing Instruments against the International Standard OIML R-76 "
            "demands absolute precision, strict environmental controls, and traceable documentation. "
            "Our platform fully digitizes this metrological workflow. "
            "From the role-governed authentication portal, operators enter an integrated command dashboard displaying real-time testing metrics, "
            "instrument fleet status, pending evaluations, and streamlined quick actions."
        )
    },
    {
        "id": "scene2",
        "target_duration": 40.0,
        "text": (
            "At the core of the platform is the Instrument Registry. "
            "Each weighing instrument, from Class I analytical micro-balances to Class IIII industrial scales, is registered with certified metrological specifications. "
            "This includes manufacturer, model, serial number, accuracy class, maximum capacity, minimum capacity, and the verification scale interval, e. "
            "The system automatically computes the total scale intervals n, verifies OIML boundary constraints, "
            "and locks active instruments against accidental modification or deletion."
        )
    },
    {
        "id": "scene3",
        "target_duration": 42.0,
        "text": (
            "When launching a verification session, selecting an instrument instantly populates its verified technical specifications. "
            "Every test is assigned a unique, sequential Test ID. "
            "Because environmental factors introduce weighing uncertainty, the operator records temperature, relative humidity, barometric pressure, "
            "and calibrated reference mass standards. "
            "Operators can attach multiple standardized OIML test definitions to a single session. "
            "The system continuously validates that ambient laboratory conditions stay strictly within OIML R-76 operating limits throughout testing."
        )
    },
    {
        "id": "scene4",
        "target_duration": 48.0,
        "text": (
            "Next is the dynamic observation and compliance engine. "
            "The system supports full OIML procedures: Weighing Performance, Repeatability, Eccentricity, and Tare Evaluation. "
            "For each load point, the operator inputs the indicated value and the extra load added until turning point. "
            "Our mathematical engine automatically calculates the turning point P, the intrinsic error E, and the zero-corrected error E c. "
            "For eccentricity tests, corner and center positions are individually audited. "
            "It then evaluates the reading against OIML R-76 Table 6 maximum permissible errors, dynamically rendering instantaneous PASS or FAIL verdicts for every point."
        )
    },
    {
        "id": "scene5",
        "target_duration": 38.0,
        "text": (
            "Once testing concludes, the session enters the formal quality assurance gate. "
            "An authorized Reviewer examines all raw observations, environmental parameters, and mathematical error curves before digital endorsement. "
            "Reviewers can approve or request revisions with detailed comments. "
            "Upon approval, the system generates an official OIML R-76 Verification Certificate, complete with a tamper-evident SHA-256 digital signature, "
            "authorized laboratory seal, and downloadable vector PDF report."
        )
    },
    {
        "id": "scene6",
        "target_duration": 34.0,
        "text": (
            "Enterprise governance underpins the entire platform. "
            "Four discrete roles: Admin, Tester, Reviewer, and Viewer, enforce strict principle-of-least-privilege access across the laboratory. "
            "An immutable audit trail captures every action and parameter change with timestamped JSON diffs. "
            "Administrators can update OIML compliance rules dynamically without source code changes, and create instant database backup snapshots. "
            "The NAWI Testing Platform: precision, compliance, and legal metrology excellence."
        )
    }
]

def generate_tts_files():
    ps1_path = os.path.join(AUDIO_DIR, "generate_tts.ps1")
    for sc in SCENES:
        txt_path = os.path.join(AUDIO_DIR, f"{sc['id']}.txt")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(sc["text"])

    with open(ps1_path, "w", encoding="utf-8") as f:
        f.write("Add-Type -AssemblyName System.Speech\n")
        f.write("$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer\n")
        f.write("$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)\n")
        f.write("$synth.Rate = 0\n\n")
        for sc in SCENES:
            txt_path = os.path.join(AUDIO_DIR, f"{sc['id']}.txt").replace("\\", "/")
            wav_path = os.path.join(AUDIO_DIR, f"{sc['id']}_raw.wav").replace("\\", "/")
            f.write(f"$text = [System.IO.File]::ReadAllText('{txt_path}', [System.Text.Encoding]::UTF8)\n")
            f.write(f"$synth.SetOutputToWaveFile('{wav_path}')\n")
            f.write(f"$synth.Speak($text)\n\n")
        f.write("$synth.Dispose()\n")

    print("[*] Generating TTS audio tracks via PowerShell System.Speech...")
    res = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1_path], capture_output=True, text=True)
    if res.returncode != 0:
        print("[-] TTS Generation Error:", res.stderr)
        return False

    print("[+] Measuring audio durations:")
    total_voice_duration = 0.0
    total_target = sum(s['target_duration'] for s in SCENES)
    for sc in SCENES:
        raw_wav = os.path.join(AUDIO_DIR, f"{sc['id']}_raw.wav")
        if os.path.exists(raw_wav):
            with wave.open(raw_wav, "rb") as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                dur = frames / float(rate)
                total_voice_duration += dur
                print(f"  {sc['id']}: {dur:.2f}s (target: {sc['target_duration']}s, pause: {sc['target_duration'] - dur:.2f}s)")
        else:
            print(f"  [-] Missing {raw_wav}")

    print(f"[+] Total raw narration length: {total_voice_duration:.2f}s / Target: {total_target:.2f}s (Exactly 4:00)")
    return True

if __name__ == "__main__":
    generate_tts_files()
