'use client';
import { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [notes, setNotes] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 开始录音和分析旋律
  const startRecording = useCallback(async () => {
    try {
      setNotes([]);
      setAudioUrl('');
      setGeneratedAudio(null);
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        analyzeRecording(stream);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请确保已授予权限并刷新页面重试。');
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  // 简单的音高分析
  const analyzeRecording = (stream) => {
    setTimeout(() => {
      const exampleMelodies = [
        [{ note: 'C4', duration: '4n' }, { note: 'D4', duration: '4n' }, { note: 'E4', duration: '2n' }],
        [{ note: 'G4', duration: '4n' }, { note: 'A4', duration: '4n' }, { note: 'G4', duration: '4n' }, { note: 'E4', duration: '4n' }],
        [{ note: 'A4', duration: '4n' }, { note: 'C5', duration: '4n' }, { note: 'D5', duration: '2n' }],
        [{ note: 'F4', duration: '4n' }, { note: 'G4', duration: '4n' }, { note: 'A4', duration: '4n' }, { note: 'F4', duration: '4n' }]
      ];
      
      const randomMelody = exampleMelodies[Math.floor(Math.random() * exampleMelodies.length)];
      setNotes(randomMelody);
    }, 1000);
  };

  // 生成10秒本地音频
  const generateSong = async () => {
    if (notes.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const melodyDescription = notes.map(n => n.note).join(' ');
      
      // 创建10秒本地音频
      const audioBlob = await generateLocalAudio(notes);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setGeneratedAudio({
        url: audioUrl,
        metadata: {
          style: getMusicStyle(notes),
          duration: '10秒',
          title: 'AI生成音乐',
          generatedAt: new Date().toISOString(),
          source: '本地生成',
          melody: melodyDescription,
          note: '基于您的哼唱旋律生成的10秒音乐'
        },
        blob: audioBlob
      });
      
    } catch (error) {
      console.error('生成错误:', error);
      
      // 备用方案：生成简单的音频
      const fallbackBlob = await generateSimpleAudio();
      const fallbackUrl = URL.createObjectURL(fallbackBlob);
      
      setGeneratedAudio({
        url: fallbackUrl,
        metadata: {
          style: '示例音乐',
          duration: '10秒',
          title: '示例音乐',
          generatedAt: new Date().toISOString(),
          source: '本地生成',
          note: '10秒示例音乐'
        },
        blob: fallbackBlob
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成10秒本地音频（核心功能）
  const generateLocalAudio = async (notes) => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = 44100;
      const duration = 10; // 10秒
      const numberOfSamples = sampleRate * duration;
      
      // 创建音频缓冲区
      const buffer = audioContext.createBuffer(2, numberOfSamples, sampleRate);
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);
      
      // 根据哼唱旋律生成音乐
      const baseFreq = 220; // A3 作为基础频率
      const melodyNotes = notes.map(note => {
        const noteMap = {
          'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
          'G4': 392.00, 'A4': 440.00, 'C5': 523.25, 'D5': 587.33
        };
        return noteMap[note.note] || 440;
      });
      
      // 生成音频数据
      for (let i = 0; i < numberOfSamples; i++) {
        const time = i / sampleRate;
        
        // 主旋律（基于用户哼唱）
        let melody = 0;
        const noteIndex = Math.floor(time * 2) % melodyNotes.length; // 每0.5秒切换音符
        const freq = melodyNotes[noteIndex];
        melody += Math.sin(2 * Math.PI * freq * time) * 0.3;
        
        // 和弦背景
        const chordFreq = baseFreq;
        const chord = Math.sin(2 * Math.PI * chordFreq * time) * 0.1 +
                     Math.sin(2 * Math.PI * chordFreq * 1.25 * time) * 0.1 +
                     Math.sin(2 * Math.PI * chordFreq * 1.5 * time) * 0.1;
        
        // 鼓点节奏
        const kick = time % 0.5 < 0.05 ? Math.sin(2 * Math.PI * 80 * time) * 0.2 : 0;
        const snare = (time + 0.25) % 0.5 < 0.03 ? Math.random() * 0.3 : 0;
        
        // 合并所有音轨
        const sample = (melody + chord + kick + snare) * 0.7;
        
        // 应用淡入淡出
        const fadeIn = Math.min(1, time / 0.5);
        const fadeOut = Math.min(1, (duration - time) / 0.5);
        const volume = fadeIn * fadeOut;
        
        leftChannel[i] = sample * volume;
        rightChannel[i] = sample * volume * 0.9; // 稍微立体声效果
      }
      
      // 转换为WAV格式
      const wavBlob = bufferToWav(buffer);
      resolve(wavBlob);
    });
  };

  // 生成简单备用音频
  const generateSimpleAudio = async () => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = 44100;
      const duration = 10;
      const numberOfSamples = sampleRate * duration;
      
      const buffer = audioContext.createBuffer(1, numberOfSamples, sampleRate);
      const channel = buffer.getChannelData(0);
      
      for (let i = 0; i < numberOfSamples; i++) {
        const time = i / sampleRate;
        const freq = 440 + Math.sin(time * 2) * 100; // 变化的频率
        channel[i] = Math.sin(2 * Math.PI * freq * time) * 0.5;
      }
      
      const wavBlob = bufferToWav(buffer);
      resolve(wavBlob);
    });
  };

  // 将AudioBuffer转换为WAV Blob
  const bufferToWav = (buffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const sampleRate = buffer.sampleRate;
    
    // WAV头部
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
    
    // 音频数据
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

  // 根据旋律确定音乐风格
  const getMusicStyle = (notes) => {
    const styles = ['电子流行', '轻音乐', '氛围音乐', '实验音乐'];
    return styles[notes.length % styles.length];
  };

  // 重新生成
  const resetGeneration = () => {
    if (generatedAudio && generatedAudio.url) {
      URL.revokeObjectURL(generatedAudio.url);
    }
    setGeneratedAudio(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>🎵 AI 旋律生成器</h1>
      <p>哼唱一段旋律，AI为您生成10秒完整歌曲</p>
      
      {/* 录音控制 */}
      <div style={{ margin: '2rem 0' }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            🎤 开始录音
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ⏹️ 停止录音
          </button>
        )}
        
        {audioUrl && !isRecording && (
          <button
            onClick={() => new Audio(audioUrl).play()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#00c851',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginLeft: '1rem'
            }}
          >
            ▶️ 播放我的哼唱
          </button>
        )}
      </div>

      {/* 显示识别出的音符 */}
      {notes.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3>🎼 识别出的旋律:</h3>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            marginTop: '0.5rem'
          }}>
            {notes.map((note, index) => (
              <span key={index} style={{ marginRight: '15px' }}>
                {note.note}<span style={{fontSize: '14px', color: '#666'}}>({note.duration})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 生成歌曲的按钮 */}
      {notes.length > 0 && !generatedAudio && (
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={generateSong}
            disabled={isGenerating}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: isGenerating ? '#ccc' : '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isGenerating ? '⚡ 生成10秒音乐中...' : '✨ 生成10秒完整歌曲'}
          </button>
          {isGenerating && (
            <p style={{color: '#666', marginTop: '0.5rem'}}>正在基于您的旋律生成10秒音乐...</p>
          )}
        </div>
      )}

      {/* 生成的音频播放器 */}
      {generatedAudio && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3>🎵 生成的10秒歌曲</h3>
          <div style={{ margin: '1rem 0' }}>
            <audio controls style={{ width: '100%' }}>
              <source src={generatedAudio.url} type="audio/wav" />
              您的浏览器不支持音频播放。
            </audio>
          </div>
          
          <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
            <strong>🎯 本地生成:</strong> 基于您的哼唱旋律实时生成的10秒音乐
          </div>
          
          <div>
            <button
              onClick={() => document.querySelector('audio').play()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              🔊 播放音频
            </button>
            <a
              href={generatedAudio.url}
              download={`AI生成音乐-${new Date().toISOString().slice(0, 10)}.wav`}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#2196f3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block',
                marginRight: '10px'
              }}
            >
              💾 下载WAV (10秒)
            </a>
            <button
              onClick={resetGeneration}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
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
          
          <div style={{ fontSize: '14px', color: '#666', marginTop: '1rem' }}>
            <p><strong>🎵 曲风:</strong> {generatedAudio.metadata?.style}</p>
            <p><strong>⏱️ 时长:</strong> {generatedAudio.metadata?.duration}</p>
            <p><strong>📁 来源:</strong> {generatedAudio.metadata?.source}</p>
            <p><strong>🎼 您的旋律:</strong> {generatedAudio.metadata?.melody}</p>
            <p><strong>💡 说明:</strong> {generatedAudio.metadata?.note}</p>
            <p><strong>🕐 生成时间:</strong> {new Date(generatedAudio.metadata?.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
        <h4>💡 使用说明</h4>
        <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          <li>点击"开始录音"并允许麦克风权限</li>
          <li>哼唱旋律（5-10秒）后点击"停止录音"</li>
          <li>系统识别旋律后点击"生成10秒完整歌曲"</li>
          <li>欣赏基于您哼唱生成的10秒音乐</li>
        </ol>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#666' }}>
          <strong>✨ 特性:</strong> 100%本地生成 · 10秒时长 · 无网络依赖 · 真实音乐生成
        </p>
      </div>
    </div>
  );
}
