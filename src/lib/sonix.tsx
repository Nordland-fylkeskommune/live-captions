import {
  ClientAuthorizationMessage,
  ClientEndStreamMessage,
  ServerMessage,
} from './types/sonix';
import { useEffect, useState } from 'react';
import { Microphone } from './Microphone';
export class Transcript {
  text: string;
  partial: string;
  onTranscript?: (text: string) => void;
  constructor(onTranscript?: (text: string) => void) {
    this.text = '';
    this.partial = '';
    if (onTranscript) this.onTranscript = onTranscript;
  }

  addText(text: string) {
    this.text += text;
    this.clearPartial();
    if (this.onTranscript) this.onTranscript(this.text);
  }
  setPartial(text: string) {
    this.partial = text;
  }
  clearPartial() {
    this.partial = '';
  }
}

export class Sonix {
  authMessage: ClientAuthorizationMessage;
  transcript: Transcript;
  ws: WebSocket | null = null;
  microphone?: Microphone;
  mediaId: string | null = null;
  audioDom?: HTMLAudioElement;
  sonixWsUri: string;
  constructor(authMessage: ClientAuthorizationMessage, sonixWsUri: string) {
    this.authMessage = authMessage;
    this.transcript = new Transcript();
    this.sonixWsUri = sonixWsUri;
  }
  connect() {
    this.ws = new WebSocket(this.sonixWsUri);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onopen = () => {
      console.log('WS -> Connected');
      this.ws?.send(JSON.stringify(this.authMessage));
    };
    this.ws.onclose = () => {
      console.log('WS -> Disconnected');
    };
    this.ws.onerror = (error) => {
      console.log('WS -> Error', error);
    };
    this.ws.onmessage = (event) => {
      let parsedMessage: ServerMessage = JSON.parse(event.data);
      switch (parsedMessage.message) {
        case 'RecognitionStarted':
          console.log('WS -> Recognition started');
          this.mediaId = parsedMessage.id;
          break;
        case 'PartialTranscript':
          console.log('WS -> Partial transcript');
          this.transcript.setPartial(parsedMessage.transcript);
          break;
        case 'FinalTranscript':
          console.log('WS -> Final transcript');
          this.transcript.addText(parsedMessage.transcript);
          break;
        case 'EndOfTranscript':
          console.log('WS -> End of transcript');
          this.ws?.close();
          break;
        default:
          console.log('WS -> Unknown message');
          break;
      }
    };
    return this;
  }
  sendAudio(audio: Blob) {
    console.log('Sending audio');
    if (this.mediaId !== null) this.ws?.send(audio);
  }
  endStream() {
    const msg: ClientEndStreamMessage = {
      message: 'EndOfStream',
    };
    this.ws?.send(JSON.stringify(msg));
  }
  start() {
    this.connect();
    this.microphone = new Microphone((audio) => {
      this.sendAudio(audio);
    });
    this.microphone.turnOnMicrophone();
  }
  stop() {
    this.microphone?.stopRecording();
    this.endStream();
  }
}

export const TranscriptComponent = ({ sonix }: { sonix: Sonix }) => {
  const [transcript, setTranscript] = useState('');
  const [textLimit, setTextLimit] = useState(100);
  useEffect(() => {
    sonix.transcript.onTranscript = (text) => {
      // Limit the text to 50 characters
      if (text.length > textLimit) {
        setTranscript(text.slice(text.length - textLimit));
      }
    };
  }, []);
  return (
    <div>
      <p>{transcript}</p>
      <button onClick={() => sonix.start()}>Start</button>
      <button onClick={() => sonix.stop()}>End</button>
    </div>
  );
};
