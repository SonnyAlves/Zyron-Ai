export default function DummyVisualBrain() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      gap: '20px'
    }}>
      <div>🧠 VISUAL BRAIN</div>
      <div style={{ fontSize: '16px', opacity: 0.8 }}>
        (Placeholder - Three.js will go here)
      </div>
      <div style={{ fontSize: '14px', opacity: 0.6 }}>
        500px width × Full height
      </div>
    </div>
  );
}
