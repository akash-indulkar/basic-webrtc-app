import { useEffect, useState } from "react"

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null)
    const [pc, setPc] = useState<RTCPeerConnection | null>(null)

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080')
        setSocket(socket)
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }))
        }
    }, [])

    const initialConn = async () => {
        if (!socket) {
            alert("Socket not found")
            return;
        }
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data)
            if (message.type === 'createAnswer') {
                await pc?.setRemoteDescription(message.sdp)
            } else if (message.type === 'iceCanditate') {
                pc?.addIceCandidate(message.canditate)
            }
        }

        const pc = new RTCPeerConnection();
        setPc(pc)
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }))
            }
        }

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }))
        }
        getCameraStreamAndSend(pc);
    }

    const getCameraStreamAndSend = async(pc: RTCPeerConnection) => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        pc.addTrack(stream.getVideoTracks()[0])
    }

    return <div>
        <button onClick={initialConn}> send video </button>
    </div>
}

