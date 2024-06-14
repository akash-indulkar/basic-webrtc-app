import { useEffect, useRef, useState } from "react"


export const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        }
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();

        const mediaStream = new MediaStream();
        pc.ontrack = (event: RTCTrackEvent) => {
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                mediaStream.addTrack(event.track);
            }
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                pc.setRemoteDescription(message.sdp).then(() => {
                    pc.createAnswer().then((answer) => {
                        pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({
                            type: 'createAnswer',
                            sdp: answer
                        }));
                    });
                });
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        }
    }
    const handleStartVideo = () => {
        if (videoRef.current) {
            videoRef.current.play().then(() => {
                setIsVideoPlaying(true);
            }).catch(error => {
                console.error("Error playing video: ", error);
            });
        }
    };

    return <div>
        <video ref={videoRef} playsInline />
            {!isVideoPlaying && (
                <button onClick={handleStartVideo}>Start Video</button>
            )}
    </div>
}