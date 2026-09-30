Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
$synth.Rate = 0

$text = [System.IO.File]::ReadAllText('D:/NAWI-System/media/audio/scene1.txt', [System.Text.Encoding]::UTF8)
$synth.SetOutputToWaveFile('D:/NAWI-System/media/audio/scene1_raw.wav')
$synth.Speak($text)

$text = [System.IO.File]::ReadAllText('D:/NAWI-System/media/audio/scene2.txt', [System.Text.Encoding]::UTF8)
$synth.SetOutputToWaveFile('D:/NAWI-System/media/audio/scene2_raw.wav')
$synth.Speak($text)

$text = [System.IO.File]::ReadAllText('D:/NAWI-System/media/audio/scene3.txt', [System.Text.Encoding]::UTF8)
$synth.SetOutputToWaveFile('D:/NAWI-System/media/audio/scene3_raw.wav')
$synth.Speak($text)

$text = [System.IO.File]::ReadAllText('D:/NAWI-System/media/audio/scene4.txt', [System.Text.Encoding]::UTF8)
$synth.SetOutputToWaveFile('D:/NAWI-System/media/audio/scene4_raw.wav')
$synth.Speak($text)

$text = [System.IO.File]::ReadAllText('D:/NAWI-System/media/audio/scene5.txt', [System.Text.Encoding]::UTF8)
$synth.SetOutputToWaveFile('D:/NAWI-System/media/audio/scene5_raw.wav')
$synth.Speak($text)

$text = [System.IO.File]::ReadAllText('D:/NAWI-System/media/audio/scene6.txt', [System.Text.Encoding]::UTF8)
$synth.SetOutputToWaveFile('D:/NAWI-System/media/audio/scene6_raw.wav')
$synth.Speak($text)

$synth.Dispose()
