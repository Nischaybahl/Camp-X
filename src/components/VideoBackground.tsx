/**
 * Reusable full-screen video background component for internal app pages.
 * Ensures an identical aesthetic to the intro but automatically loop/plays 
 * without scroll reliance for content pages.
 */
export default function VideoBackground() {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#000', overflow: 'hidden' }}>
            {/* Dark overlay for readability of foreground elements */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>
            <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6,
                    display: 'block',
                }}
            >
                <source src="/app-bg.mp4" type="video/mp4" />
            </video>
        </div>
    );
}
