export async function POST(request) {
  console.log('🎵 收到生成歌曲请求...');
  
  try {
    const { melody, description } = await request.json();
    console.log('输入的旋律:', melody);
    console.log('风格描述:', description);

    if (!melody) {
      return new Response(JSON.stringify({ error: '没有提供旋律数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔗 模拟AI音乐生成中...');

    // 模拟AI处理时间（2-3秒）
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // 根据旋律和描述生成模拟结果
    const melodyNotes = melody.split(' ').slice(0, 4).join(' ');
    const style = description.includes('悲伤') ? '悲伤' :
                 description.includes('摇滚') ? '摇滚' : '流行';

    // 模拟生成的音频URL（使用公共领域的示例音频）
    const sampleAudios = [
      'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
      'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3',
      'https://assets.mixkit.co/music/preview/mixkit-creative-breakbeat-1162.mp3'
    ];
    
    const randomAudio = sampleAudios[Math.floor(Math.random() * sampleAudios.length)];

    console.log('✅ 模拟生成成功！');
    console.log('生成的音频:', randomAudio);

    return new Response(JSON.stringify({
      success: true,
      audioUrl: randomAudio,
      metadata: {
        style: style,
        duration: '15秒',
        melodyUsed: melodyNotes,
        description: description,
        generatedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ 生成过程中出现错误:', error);
    
    return new Response(JSON.stringify({
      error: '生成失败: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
