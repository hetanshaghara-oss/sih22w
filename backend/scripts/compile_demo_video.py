import os
import subprocess
import glob

BASE_DIR = r"D:\NAWI-System"
SLIDES_DIR = os.path.join(BASE_DIR, r"media\slides")
AUDIO_DIR = os.path.join(BASE_DIR, r"media\audio")
TEMP_DIR = os.path.join(BASE_DIR, r"media\temp_video")
OUTPUT_VIDEO = os.path.join(BASE_DIR, "NAWI_Demo_Video_4Min.mp4")

os.makedirs(TEMP_DIR, exist_ok=True)

# 240 seconds total = exactly 4 minutes (4:00)
SCENE_TIMELINE = [
    {
        "id": "scene1",
        "target_dur": 38.0,
        "audio": os.path.join(AUDIO_DIR, "scene1_raw.wav"),
        "slides": [
            ("slide_01_intro.png", 5.0),
            ("slide_02_login.png", 13.0),
            ("slide_03_dashboard.png", 20.0),
        ]
    },
    {
        "id": "scene2",
        "target_dur": 40.0,
        "audio": os.path.join(AUDIO_DIR, "scene2_raw.wav"),
        "slides": [
            ("slide_04_instruments.png", 20.0),
            ("slide_05_add_instrument.png", 20.0),
        ]
    },
    {
        "id": "scene3",
        "target_dur": 42.0,
        "audio": os.path.join(AUDIO_DIR, "scene3_raw.wav"),
        "slides": [
            ("slide_06_new_test.png", 21.0),
            ("slide_07_workspace_obs.png", 21.0),
        ]
    },
    {
        "id": "scene4",
        "target_dur": 48.0,
        "audio": os.path.join(AUDIO_DIR, "scene4_raw.wav"),
        "slides": [
            ("slide_07_workspace_obs.png", 24.0),
            ("slide_08_compliance_check.png", 24.0),
        ]
    },
    {
        "id": "scene5",
        "target_dur": 36.0,
        "audio": os.path.join(AUDIO_DIR, "scene5_raw.wav"),
        "slides": [
            ("slide_09_reports.png", 16.0),
            ("slide_10_certificate_view.png", 20.0),
        ]
    },
    {
        "id": "scene6",
        "target_dur": 36.0,
        "audio": os.path.join(AUDIO_DIR, "scene6_raw.wav"),
        "slides": [
            ("slide_12_admin_users.png", 9.0),
            ("slide_11_admin_rules.png", 9.0),
            ("slide_13_admin_audit.png", 9.0),
            ("slide_14_outro.png", 9.0),
        ]
    }
]

def run_cmd(cmd, desc):
    print(f"[*] {desc}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[-] Error in {desc}:")
        print(res.stderr)
        raise RuntimeError(f"FFmpeg failed in {desc}")
    return res

def build_video():
    print("=== Starting 4-Minute Full Overview Video Compilation ===")
    
    scene_files = []
    
    for s_idx, scene in enumerate(SCENE_TIMELINE):
        sid = scene["id"]
        target_dur = scene["target_dur"]
        print(f"\n--- Processing {sid} (Target Duration: {target_dur}s) ---")
        
        # 1. Pad Audio to exact target duration
        scene_audio = os.path.join(TEMP_DIR, f"{sid}_padded_audio.wav")
        cmd_audio = [
            "ffmpeg", "-y",
            "-i", scene["audio"],
            "-af", f"apad=whole_dur={target_dur}",
            "-t", str(target_dur),
            scene_audio
        ]
        run_cmd(cmd_audio, f"Pad audio for {sid}")
        
        # 2. Render each slide video segment
        slide_vids = []
        for v_idx, (s_img_name, s_dur) in enumerate(scene["slides"]):
            s_img_path = os.path.join(SLIDES_DIR, s_img_name)
            s_vid_path = os.path.join(TEMP_DIR, f"{sid}_part{v_idx}.mp4")
            cmd_slide = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-framerate", "30",
                "-t", str(s_dur),
                "-i", s_img_path,
                "-vf", "scale=1920:1080,format=yuv420p",
                "-c:v", "libx264",
                "-preset", "faster",
                "-tune", "stillimage",
                "-r", "30",
                s_vid_path
            ]
            run_cmd(cmd_slide, f"Render slide {s_img_name} ({s_dur}s)")
            slide_vids.append(s_vid_path)
            
        # 3. Concat slide videos into scene video
        concat_txt = os.path.join(TEMP_DIR, f"{sid}_concat.txt")
        with open(concat_txt, "w") as f:
            for sv in slide_vids:
                f.write(f"file '{sv.replace(os.sep, '/')}'\n")
                
        scene_merged_vid = os.path.join(TEMP_DIR, f"{sid}_video_only.mp4")
        cmd_concat_v = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_txt,
            "-c", "copy",
            scene_merged_vid
        ]
        run_cmd(cmd_concat_v, f"Concat slides for {sid}")
        
        # 4. Mux scene video with padded audio
        scene_mp4 = os.path.join(TEMP_DIR, f"{sid}_complete.mp4")
        cmd_mux = [
            "ffmpeg", "-y",
            "-i", scene_merged_vid,
            "-i", scene_audio,
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            scene_mp4
        ]
        run_cmd(cmd_mux, f"Mux audio and video for {sid}")
        scene_files.append(scene_mp4)

    # 5. Master Concatenation of all 6 scenes
    print("\n--- Merging All 6 Scenes into Master Video ---")
    master_concat_txt = os.path.join(TEMP_DIR, "master_concat.txt")
    with open(master_concat_txt, "w") as f:
        for sf in scene_files:
            f.write(f"file '{sf.replace(os.sep, '/')}'\n")
            
    raw_master = os.path.join(TEMP_DIR, "raw_master.mp4")
    cmd_master = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", master_concat_txt,
        "-c", "copy",
        raw_master
    ]
    run_cmd(cmd_master, "Merge all scenes into raw master video")
    
    # 6. Synthesize subtle background ambient harmonic pad & mix with voiceover
    print("\n--- Adding Background Ambient Audio Bed & Final Muxing ---")
    # Background music expression: gentle ambient chord (A 220Hz + E 330Hz + C# 554Hz) ducked at -24dB with soft fade-in/fade-out
    bg_expr = (
        "0.015*sin(2*PI*220*t) + 0.012*sin(2*PI*330*t) + "
        "0.010*sin(2*PI*440*t) + 0.008*sin(2*PI*554*t) + "
        "0.006*sin(2*PI*659*t)"
    )
    
    cmd_final = [
        "ffmpeg", "-y",
        "-i", raw_master,
        "-f", "lavfi",
        "-i", f"aevalsrc={bg_expr}:s=44100:d=240.0",
        "-filter_complex",
        "[1:a]afade=t=in:ss=0:d=3,afade=t=out:st=236:d=4,volume=0.4[bg];"
        "[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "0:v",
        "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "256k",
        "-movflags", "+faststart",
        OUTPUT_VIDEO
    ]
    run_cmd(cmd_final, "Final composite audio mixing and export")
    
    if os.path.exists(OUTPUT_VIDEO):
        v_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print(f"\n=======================================================")
        print(f"[SUCCESS] 4-Minute Demo Video Created Successfully!")
        print(f"  Target File : {OUTPUT_VIDEO}")
        print(f"  File Size   : {v_size_mb:.2f} MB")
        print(f"  Duration    : 04:00 (240.0 seconds)")
        print(f"  Resolution  : 1920x1080 Full HD (30 FPS)")
        print(f"  Audio       : Dual-track mixed (Voiceover + Ambient BGM)")
        print(f"=======================================================\n")
    else:
        print("[-] Video creation failed.")

if __name__ == "__main__":
    build_video()
