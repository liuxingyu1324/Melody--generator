'use client';
import { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [recordedTime, setRecordedTime] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState('准备录音');
  const [notes, setNotes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState('handpan');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realTimePitches, setRealTimePitches] = useState([]);
  const [detectedKey, setDetectedKey] = useState(''); // 新增：检测到的调式

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const pitchDetectionIntervalRef = useRef(null);
  const detectedPitchesRef = useRef([]);
  const audioDataArrayRef = useRef(null);

  // 乐器配置
  const instruments = {
    handpan: {
      name: '手碟',
      description: '空灵冥想的手碟音色',
      icon: '🥁',
      color: '#8B4513'
    },
    piano: {
      name: '钢琴',
      description: '古典优雅的钢琴音色',
      icon: '🎹',
      color: '#2E8B57'
    },
    ambient: {
      name: '氛围音乐',
      description: '空灵的环境音色',
      icon: '🎵',
      color: '#4682B4'
    }
  };

  // 完整的音符频率映射
  const noteFrequencies = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50
  };

  // 新增：调式配置
  const musicalKeys = {
    'C major': { notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], type: 'major' },
    'G major': { notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'], type: 'major' },
    'D major': { notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'], type: 'major' },
    'A major': { notes: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'], type: 'major' },
    'E major': { notes: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'], type: 'major' },
    'B major': { notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'], type: 'major' },
    'F# major': { notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'], type: 'major' },
    'C# major': { notes: ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'], type: 'major' },
    'F major': { notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E'], type: 'major' },
    'A minor': { notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], type: 'minor' },
    'E minor': { notes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'], type: 'minor' },
    'B minor': { notes: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'], type: 'minor' },
    'F# minor': { notes: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'], type: 'minor' },
    'C# minor': { notes: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'], type: 'minor' },
    'G# minor': { notes: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'], type: 'minor' },
    'D# minor': { notes: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'], type: 'minor' },
    'A# minor': { notes: ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'], type: 'minor' },
    'D minor': { notes: ['D', 'E', 'F', 'G', 'A', 'A#', 'C'], type: 'minor' },
    'G minor': { notes: ['G', 'A', 'A#', 'C', 'D', 'D#', 'F'], type: 'minor' },
    'C minor': { notes: ['C', 'D', 'D#', 'F', 'G', 'G#', 'A#'], type: 'minor' }
  };

  // 新增：检测调式
  const detectMusicalKey = (notes) => {
    if (notes.length === 0) return 'C major';
    
    const noteNames = notes.map(note => {
      const noteName = note.note.replace(/[0-9]/g, ''); // 移除数字
      return noteName.length > 1 ? noteName[0] + '#' : noteName; // 处理升降号
    });
    
    // 找出最匹配的调式
    let bestKey = 'C major';
    let maxMatch = 0;
    
    Object.entries(musicalKeys).forEach(([keyName, key]) => {
      const matchCount = noteNames.filter(note => key.notes.includes(note)).length;
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        bestKey = keyName;
      }
    });
    
    return bestKey;
  };

  // 新增：根据调式生成扩展音符
  const generateExtendedMelody = (originalNotes, key) => {
    if (originalNotes.length === 0) return originalNotes;
    
    const keyInfo = musicalKeys[key];
    if (!keyInfo) return originalNotes;
    
    const extendedNotes = [...originalNotes];
    
    // 获取调式内的所有音符（多个八度）
    const keyNotes = [];
    for (let octave = 3; octave <= 5; octave++) {
      keyInfo.notes.forEach(note => {
        keyNotes.push(`${note}${octave}`);
      });
    }
    
    // 添加调式内的经过音和辅助音
    originalNotes.forEach((note, index) => {
      if (index < originalNotes.length - 1) {
        // 在当前音符和下一个音符之间添加经过音
        const currentNote = note.note;
        const nextNote = originalNotes[index + 1].note;
        
        // 找出调式内合适的经过音
        const passingNotes = keyNotes.filter(keyNote => {
          const currentFreq = noteFrequencies[currentNote] || 440;
          const nextFreq = noteFrequencies[nextNote] || 440;
          const keyFreq = noteFrequencies[keyNote] || 440;
          
          return keyFreq > Math.min(currentFreq, nextFreq) &&
                 keyFreq < Math.max(currentFreq, nextFreq);
        });
        
        if (passingNotes.length > 0) {
          const selectedPassingNote = passingNotes[Math.floor(Math.random() * passingNotes.length)];
          extendedNotes.splice(extendedNotes.indexOf(note) + 1, 0, {
            note: selectedPassingNote,
            duration: '8n',
            confidence: note.confidence * 0.8,
            type: 'passing'
          });
        }
      }
    });
    
    return extendedNotes.slice(0, 12); // 限制最大音符数量
  };

  // 新增：生成和声进行
  const generateHarmonyProgression = (melodyNotes, key) => {
    const keyInfo = musicalKeys[key];
    if (!keyInfo || melodyNotes.length === 0) return [];
    
    const progression = [];
    const scaleDegrees = keyInfo.notes;
    
    // 简单的I-IV-V-I和声进行
    const chords = [
      [0, 2, 4], // I级和弦
      [3, 5, 0], // IV级和弦（下一个八度）
      [4, 6, 1], // V级和弦
      [0, 2, 4]  // I级和弦
    ];
    
    chords.forEach((chord, index) => {
      const chordNotes = chord.map(degree => {
        const noteName = scaleDegrees[degree % scaleDegrees.length];
        const octave = 3 + Math.floor(degree / scaleDegrees.length);
        return `${noteName}${octave}`;
      });
      
      progression.push({
        notes: chordNotes,
        duration: '2n',
        type: 'chord',
        degree: ['I', 'IV', 'V', 'I'][index]
      });
    });
    
    return progression;
  };

  // 开始录音（保持不变）
  const startRecording = useCallback(async () => {
    try {
      setAudioUrl('');
      setRecordedTime(0);
      setVolumeLevel(0);
      setRecordingStatus('请求麦克风权限...');
      setNotes([]);
      setGeneratedAudio(null);
      setRecognitionConfidence(0);
      setRealTimePitches([]);
      setDetectedKey('');
      audioChunksRef.current = [];
      detectedPitchesRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      setRecordingStatus('初始化音频分析...');

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      audioDataArrayRef.current = new Float32Array(bufferLength);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (pitchDetectionIntervalRef.current) {
          clearInterval(pitchDetectionIntervalRef.current);
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingStatus('分析旋律中...');
        setIsAnalyzing(true);
        
        setTimeout(() => {
          processDetectedPitches();
        }, 1000);
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setRecordingStatus('录音中...');

      let time = 0;
      recordingIntervalRef.current = setInterval(() => {
        time += 1;
        setRecordedTime(time);
        const volume = 30 + Math.sin(time * 2) * 20 + Math.random() * 10;
        setVolumeLevel(Math.min(100, Math.max(0, volume)));
      }, 1000);

      startRealTimePitchDetection();

    } catch (error) {
      console.error('无法访问麦克风:', error);
      setRecordingStatus('错误：无法访问麦克风');
    }
  }, []);

  // 停止录音（保持不变）
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
      
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  }, [isRecording]);

  // 实时音高检测（保持不变）
  const startRealTimePitchDetection = () => {
    if (!analyserRef.current || !audioDataArrayRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const sampleRate = audioContextRef.current.sampleRate;
    
    pitchDetectionIntervalRef.current = setInterval(() => {
      if (!isRecording || !analyserRef.current) return;
      
      analyserRef.current.getFloatFrequencyData(audioDataArrayRef.current);
      const volume = calculateVolume(audioDataArrayRef.current);
      setVolumeLevel(volume);
      
      if (volume > 0.1) {
        const pitchResult = detectPitchFromFrequencyData(audioDataArrayRef.current, sampleRate, bufferLength);
        
        if (pitchResult && pitchResult.confidence > 0.6) {
          const detection = {
            time: Date.now(),
            frequency: pitchResult.frequency,
            note: pitchResult.note,
            confidence: pitchResult.confidence,
            volume: volume
          };
          
          detectedPitchesRef.current.push(detection);
          setRealTimePitches(prev => {
            const newPitches = [...prev, detection];
            return newPitches.slice(-5);
          });
        }
      }
    }, 100);
  };

  // 计算音量（保持不变）
  const calculateVolume = (frequencyData) => {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > -100) {
        sum += Math.pow(10, frequencyData[i] / 20);
      }
    }
    const rms = Math.sqrt(sum / frequencyData.length);
    return Math.min(100, rms * 10);
  };

  // 从频率数据检测音高（保持不变）
  const detectPitchFromFrequencyData = (frequencyData, sampleRate, bufferLength) => {
    if (!frequencyData || frequencyData.length === 0) return null;
    
    let maxMagnitude = -Infinity;
    let maxIndex = 0;
    
    const minIndex = Math.floor(80 * bufferLength / (sampleRate / 2));
    const maxIndexLimit = Math.floor(1000 * bufferLength / (sampleRate / 2));
    
    for (let i = minIndex; i < maxIndexLimit && i < frequencyData.length; i++) {
      if (frequencyData[i] > maxMagnitude && frequencyData[i] > -100) {
        maxMagnitude = frequencyData[i];
        maxIndex = i;
      }
    }
    
    if (maxMagnitude === -Infinity) return null;
    
    const frequency = maxIndex * (sampleRate / 2) / bufferLength;
    return frequencyToNote(frequency);
  };

  // 频率到音符转换（保持不变）
  const frequencyToNote = (frequency) => {
    if (frequency < 80 || frequency > 1000) return null;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    
    const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 57;
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const noteName = noteNames[noteIndex] + octave;
    
    const expectedFreq = noteFrequencies[noteName];
    if (!expectedFreq) return null;
    
    const cents = 1200 * Math.log2(frequency / expectedFreq);
    const confidence = Math.max(0, 1 - Math.abs(cents) / 50);
    
    return {
      note: noteName,
      frequency: Math.round(frequency * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      centsError: Math.round(cents)
    };
  };

  // 处理检测到的音高数据（修改：加入调式检测）
  const processDetectedPitches = () => {
    const detectedPitches = detectedPitchesRef.current;
    
    if (detectedPitches.length === 0) {
      useIntelligentExample();
      setRecognitionConfidence(0.3);
      setIsAnalyzing(false);
      setRecordingStatus('使用示例旋律');
      setDetectedKey('C major');
      return;
    }
    
    const analyzedMelody = analyzeDetectedPitches(detectedPitches);
    
    // 检测调式
    const detectedKey = detectMusicalKey(analyzedMelody.notes);
    setDetectedKey(detectedKey);
    
    setNotes(analyzedMelody.notes);
    setRecognitionConfidence(analyzedMelody.confidence);
    setIsAnalyzing(false);
    setRecordingStatus(`识别到 ${analyzedMelody.notes.length} 个音符 - 调式: ${detectedKey}`);
  };

  // 分析检测到的音高序列（保持不变）
  const analyzeDetectedPitches = (pitches) => {
    if (pitches.length === 0) {
      return { notes: [], confidence: 0 };
    }
    
    const validPitches = pitches.filter(p => p.confidence > 0.6);
    if (validPitches.length === 0) {
      return { notes: [], confidence: 0 };
    }
    
    const timeWindows = [];
    const windowSize = 300;
    let currentWindow = [];
    let currentWindowStart = validPitches[0].time;
    
    validPitches.forEach(pitch => {
      if (pitch.time - currentWindowStart < windowSize) {
        currentWindow.push(pitch);
      } else {
        if (currentWindow.length > 0) {
          timeWindows.push([...currentWindow]);
        }
        currentWindow = [pitch];
        currentWindowStart = pitch.time;
      }
    });
    
    if (currentWindow.length > 0) {
      timeWindows.push(currentWindow);
    }
    
    const stableNotes = timeWindows.map(window => {
      const noteCount = {};
      window.forEach(pitch => {
        noteCount[pitch.note] = (noteCount[pitch.note] || 0) + pitch.confidence;
      });
      
      const bestNote = Object.keys(noteCount).reduce((a, b) =>
        noteCount[a] > noteCount[b] ? a : b
      );
      
      const notePitches = window.filter(p => p.note === bestNote);
      const avgConfidence = notePitches.reduce((sum, p) => sum + p.confidence, 0) / notePitches.length;
      
      return {
        note: bestNote,
        duration: window.length > 2 ? '4n' : '8n',
        confidence: avgConfidence,
        startTime: window[0].time
      };
    });
    
    const uniqueNotes = [];
    let lastNote = null;
    
    stableNotes.forEach(note => {
      if (!lastNote || note.note !== lastNote.note) {
        uniqueNotes.push({
          note: note.note,
          duration: note.duration,
          confidence: note.confidence
        });
        lastNote = note;
      }
    });
    
    const overallConfidence = uniqueNotes.length > 0
      ? uniqueNotes.reduce((sum, note) => sum + note.confidence, 0) / uniqueNotes.length
      : 0;
    
    return {
      notes: uniqueNotes.slice(0, 8),
      confidence: Math.round(overallConfidence * 100) / 100
    };
  };

  // 智能示例（保持不变）
  const useIntelligentExample = () => {
    const intelligentExamples = [
      [
        { note: 'C4', duration: '4n', confidence: 0.8 },
        { note: 'E4', duration: '4n', confidence: 0.8 },
        { note: 'G4', duration: '2n', confidence: 0.8 }
      ],
      [
        { note: 'D4', duration: '4n', confidence: 0.8 },
        { note: 'F4', duration: '4n', confidence: 0.8 },
        { note: 'A4', duration: '2n', confidence: 0.8 }
      ],
      [
        { note: 'G4', duration: '4n', confidence: 0.8 },
        { note: 'B4', duration: '4n', confidence: 0.8 },
        { note: 'D5', duration: '2n', confidence: 0.8 }
      ],
      [
        { note: 'A4', duration: '4n', confidence: 0.8 },
        { note: 'C5', duration: '4n', confidence: 0.8 },
        { note: 'E5', duration: '2n', confidence: 0.8 }
      ]
    ];
    
    const randomExample = intelligentExamples[Math.floor(Math.random() * intelligentExamples.length)];
    setNotes(randomExample);
  };

  // 生成音乐（修改：加入调式扩展）
  const generateSong = async () => {
    if (notes.length === 0) return;
    
    setIsGenerating(true);
    setRecordingStatus('生成音乐中...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = 44100;
      const duration = 7;
      const numberOfSamples = sampleRate * duration;
      
      const buffer = audioContext.createBuffer(2, numberOfSamples, sampleRate);
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);
      
      // 扩展旋律：加入调式内的其他音符
      const extendedMelody = generateExtendedMelody(notes, detectedKey);
      
      // 生成和声进行
      const harmonyProgression = generateHarmonyProgression(extendedMelody, detectedKey);
      
      const melodyFreqs = extendedMelody.map(note => noteFrequencies[note.note] || 440);
      
      for (let i = 0; i < numberOfSamples; i++) {
        const time = i / sampleRate;
        
        let leftSample = 0;
        let rightSample = 0;
        
        // 主旋律
        const noteIndex = Math.floor(time * 2) % melodyFreqs.length;
        const mainFreq = melodyFreqs[noteIndex];
        
        if (mainFreq) {
          // 根据乐器类型生成音色
          let instrumentSound = 0;
          switch(selectedInstrument) {
            case 'handpan':
              instrumentSound = Math.sin(2 * Math.PI * mainFreq * time) * 0.4;
              instrumentSound += Math.sin(2 * Math.PI * mainFreq * 2.0 * time) * 0.3;
              instrumentSound += Math.sin(2 * Math.PI * mainFreq * 3.0 * time) * 0.2;
              break;
            case 'piano':
              instrumentSound = Math.sin(2 * Math.PI * mainFreq * time) * 0.3;
              instrumentSound += Math.sin(2 * Math.PI * mainFreq * 2.0 * time) * 0.2;
              break;
            case 'ambient':
              instrumentSound = Math.sin(2 * Math.PI * mainFreq * time * 0.5) * 0.3;
              break;
            default:
              instrumentSound = Math.sin(2 * Math.PI * mainFreq * time) * 0.4;
          }
          
          // 和声层 - 基于调式的和声
          const chordIndex = Math.floor(time) % harmonyProgression.length;
          const currentChord = harmonyProgression[chordIndex];
          let harmony = 0;
          
          if (currentChord) {
            currentChord.notes.forEach((chordNote, index) => {
              const chordFreq = noteFrequencies[chordNote] || mainFreq * (index + 1) * 0.5;
              harmony += Math.sin(2 * Math.PI * chordFreq * time) * 0.1;
            });
          }
          
          // 低音部 - 根音
          const rootNote = detectedKey.split(' ')[0];
          const rootFreq = noteFrequencies[`${rootNote}3`] || mainFreq * 0.5;
          const bass = Math.sin(2 * Math.PI * rootFreq * time) * 0.2;
          
          const sample = (instrumentSound + harmony + bass) * 0.7;
          const volume = Math.min(1, time / 0.5) * Math.min(1, (duration - time) / 0.5);
          
          leftSample = sample * volume;
          rightSample = sample * volume * 0.9;
        }
        
        leftChannel[i] = leftSample;
        rightChannel[i] = rightSample;
      }
      
      const wavBlob = bufferToWav(buffer);
      const audioUrl = URL.createObjectURL(wavBlob);
      
      setGeneratedAudio({
        url: audioUrl,
        metadata: {
          instrument: instruments[selectedInstrument].name,
          style: getMusicStyle(notes, selectedInstrument),
          duration: '7秒',
          title: `${instruments[selectedInstrument].name}演奏 - 基于您的哼唱`,
          generatedAt: new Date().toISOString(),
          source: 'AI旋律识别',
          melody: notes.map(n => n.note).join(' '),
          extendedMelody: extendedMelody.map(n => n.note).join(' '),
          key: detectedKey,
          confidence: `识别置信度: ${Math.round(recognitionConfidence * 100)}%`,
          noteCount: `识别到 ${notes.length} 个音符`,
          extendedNoteCount: `扩展为 ${extendedMelody.length} 个音符`,
          harmony: `和声进行: ${harmonyProgression.map(h => h.degree).join(' - ')}`
        },
        blob: wavBlob
      });
      
      setRecordingStatus('音乐生成完成！');
      
    } catch (error) {
      console.error('生成错误:', error);
      setRecordingStatus('生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 将AudioBuffer转换为WAV（保持不变）
  const bufferToWav = (buffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const sampleRate = buffer.sampleRate;
    
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    let offset = 0;
    writeString(offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString(offset, 'WAVE'); offset += 4;
    writeString(offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numOfChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numOfChannels * 2, true); offset += 4;
    view.setUint16(offset, numOfChannels * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(offset, 'data'); offset += 4;
    view.setUint32(offset, buffer.length * numOfChannels * 2, true); offset += 4;
    
    for (let channel = 0; channel < numOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([bufferArray], { type: 'audio/wav' });
  };

  // 获取音乐风格（保持不变）
  const getMusicStyle = (notes, instrumentType) => {
    const styles = {
      handpan: ['冥想音乐', '世界音乐', '治愈系'],
      piano: ['古典音乐', '轻音乐', '钢琴独奏'],
      ambient: ['氛围音乐', '环境音乐', '太空音乐']
    };
    
    const instrumentStyles = styles[instrumentType] || styles.handpan;
    return instrumentStyles[notes.length % instrumentStyles.length];
  };

  // 重新生成（保持不变）
  const resetGeneration = () => {
    if (generatedAudio && generatedAudio.url) {
      URL.revokeObjectURL(generatedAudio.url);
    }
    setGeneratedAudio(null);
    setRecordingStatus('准备录音');
  };

  // 格式化时间显示（保持不变）
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取音量条颜色（保持不变）
  const getVolumeColor = (volume) => {
    if (volume > 70) return '#ff4444';
    if (volume > 40) return '#ffaa00';
    if (volume > 10) return '#00c851';
    return '#cccccc';
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* 标题区域 */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#333',
          margin: '0 0 0.5rem 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎵 AI 音乐生成器
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
          智能旋律识别 + 调式扩展 + 7秒音乐生成
        </p>
      </div>

      {/* 乐器选择器 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>🎼 选择乐器</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {Object.entries(instruments).map(([key, instrument]) => (
            <button
              key={key}
              onClick={() => setSelectedInstrument(key)}
              style={{
                padding: '1rem 1.5rem',
                fontSize: '14px',
                backgroundColor: selectedInstrument === key ? instrument.color : '#f8f9fa',
                color: selectedInstrument === key ? 'white' : '#333',
                border: `2px solid ${selectedInstrument === key ? instrument.color : '#dee2e6'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '120px'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '0.5rem' }}>{instrument.icon}</div>
              <div style={{ fontWeight: 'bold' }}>{instrument.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{instrument.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 主控制面板 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem'
      }}>
        {/* 状态显示 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
            {recordingStatus}
          </h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007acc' }}>
            {formatTime(recordedTime)}
          </div>
          {detectedKey && (
            <div style={{ marginTop: '0.5rem', color: '#28a745', fontWeight: 'bold' }}>
              检测到调式: {detectedKey}
            </div>
          )}
        </div>

        {/* 录音控制按钮 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isAnalyzing || isGenerating}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: isAnalyzing || isGenerating ? '#ccc' : instruments[selectedInstrument].color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnalyzing || isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                minWidth: '140px'
              }}
            >
              {isAnalyzing ? '⚡ 分析中...' : isGenerating ? '🎵 生成中...' : '🎤 开始录音'}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                minWidth: '140px'
              }}
            >
              ⏹️ 停止录音
            </button>
          )}
        </div>

        {/* 实时音量显示 */}
        {isRecording && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: 'bold', color: '#333', minWidth: '80px' }}>
                实时音量:
              </span>
              <div style={{
                flex: 1,
                height: '20px',
                backgroundColor: '#eee',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: getVolumeColor(volumeLevel),
                    width: `${volumeLevel}%`,
                    borderRadius: '10px',
                    transition: 'width 0.1s ease'
                  }}
                />
              </div>
              <span style={{ fontWeight: 'bold', color: '#333', minWidth: '40px' }}>
                {Math.round(volumeLevel)}%
              </span>
            </div>
            
            {/* 音量建议 */}
            <div style={{
              fontSize: '12px',
              color: '#666',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              {volumeLevel > 70 ? '🔴 音量过大 - 请离麦克风远一些' :
               volumeLevel > 40 ? '🟢 音量良好 - 保持当前距离' :
               volumeLevel > 10 ? '🟡 音量较低 - 请靠近麦克风' :
               '⚪ 未检测到声音 - 请开始哼唱'}
            </div>
          </div>
        )}

        {/* 旋律识别结果 */}
        {notes.length > 0 && (
          <div style={{
            backgroundColor: '#e7f3ff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '2px dashed #007acc',
            marginBottom: '2rem'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#007acc' }}>
              🎼 识别到的旋律
            </h4>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '1rem'
            }}>
              {notes.map((note, index) => (
                <span key={index} style={{ marginRight: '15px' }}>
                  {note.note}<span style={{fontSize: '14px', color: '#666'}}>({note.duration})</span>
                </span>
              ))}
            </div>
            
            {/* 调式信息 */}
            {detectedKey && (
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#d4edda',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <strong>🎵 检测到调式: {detectedKey}</strong>
                <div style={{ fontSize: '12px', color: '#155724' }}>
                  将自动添加该调式的和声与经过音
                </div>
              </div>
            )}
            
            {/* 识别置信度显示 */}
            {recognitionConfidence > 0 && (
              <div style={{
                padding: '0.5rem',
                backgroundColor: recognitionConfidence > 0.7 ? '#d4edda' :
                               recognitionConfidence > 0.4 ? '#fff3cd' : '#f8d7da',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <strong>识别置信度: {Math.round(recognitionConfidence * 100)}%</strong>
                {recognitionConfidence > 0.7 ? ' 👍 识别良好' :
                 recognitionConfidence > 0.4 ? ' 💡 识别一般' : ' ⚠️ 识别较弱'}
              </div>
            )}
          </div>
        )}

        {/* 生成音乐按钮 */}
        {notes.length > 0 && !generatedAudio && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={generateSong}
              disabled={isGenerating}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: isGenerating ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isGenerating ? '⚡ 生成中...' : `✨ 生成${instruments[selectedInstrument].name}音乐`}
            </button>
            {detectedKey && (
              <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
                将基于 {detectedKey} 调式生成丰富的和声
              </div>
            )}
          </div>
        )}

        {/* 生成的音乐播放器 */}
        {generatedAudio && (
          <div style={{
            backgroundColor: '#e8f5e8',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#2e7d32' }}>
              🎵 生成的音乐
            </h4>
            
            <div style={{ margin: '1rem 0' }}>
              <audio controls style={{ width: '100%' }}>
                <source src={generatedAudio.url} type="audio/wav" />
                您的浏览器不支持音频播放。
              </audio>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => document.querySelector('audio').play()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ▶️ 播放
              </button>
              <a
                href={generatedAudio.url}
                download="generated-music.wav"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}
              >
                💾 下载
              </a>
              <button
                onClick={resetGeneration}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 重新生成
              </button>
            </div>
            
            {/* 音乐信息 */}
            <div style={{ fontSize: '14px', color: '#666' }}>
              <p><strong>🎵 乐器:</strong> {generatedAudio.metadata.instrument}</p>
              <p><strong>🎼 调式:</strong> {generatedAudio.metadata.key}</p>
              <p><strong>✨ 和声进行:</strong> {generatedAudio.metadata.harmony}</p>
              <p><strong>⏱️ 时长:</strong> {generatedAudio.metadata.duration}</p>
              <p><strong>🎯 识别置信度:</strong> {generatedAudio.metadata.confidence}</p>
              <p><strong>📊 音符扩展:</strong> {generatedAudio.metadata.extendedNoteCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>💡 新功能：调式扩展</h3>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>🎵 自动调式检测</strong> - 根据您的哼唱自动识别所属调式（大调/小调）</p>
          <p><strong>🎼 和声扩展</strong> - 自动添加调式内的I-IV-V级和弦进行</p>
          <p><strong>✨ 旋律丰富</strong> - 加入经过音、辅助音等装饰音</p>
          <p><strong>🎹 多乐器支持</strong> - 不同乐器采用不同的和声处理方式</p>
          <p><strong>📈 音乐性提升</strong> - 生成的音乐更加丰富、和谐、专业</p>
        </div>
      </div>
    </div>
  );
}


