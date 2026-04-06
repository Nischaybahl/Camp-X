/**
 * Reusable full-screen video background component for internal app pages.
 * Ensures an identical aesthetic to the intro but automatically loop/plays 
 * without scroll reliance for content pages.
 */
export default function VideoBackground() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#000', overflow: 'hidden' }}>
            {/* Dark overlay for readability of foreground elements */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 }}></div>
            <iframe 
                src="https://www.youtube.com/embed/e4x5du87qGQ?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=e4x5du87qGQ"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100vw',
                    height: '56.25vw', // 16:9 ratio
                    minHeight: '100vh',
                    minWidth: '177.77vh',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    opacity: 0.6,
                }}
            ></iframe>
        </div>
    );
}
