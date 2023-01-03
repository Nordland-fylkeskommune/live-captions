import {
  ClientAuthorizationMessage,
  ClientEndStreamMessage,
  ServerMessage,
} from './types/sonix';
import { useEffect, useState } from 'react';
import { Microphone } from './Microphone';
// import { EventEmitter } from 'events';

let EventEmitter = EventTarget;
declare interface TranscriptEmitter {
  on(event: 'transcript', listener: (text: string) => void): this;
  on(event: string, listener: Function): this;
}

export class Transcript {
  text: string;
  partial: string;
  emitter: EventTarget;
  constructor() {
    this.text = '';
    this.partial = '';
    class TranscriptEmitter extends EventEmitter {}
    this.emitter = new TranscriptEmitter();
  }

  addText(text: string) {
    this.text += text;
    this.clearPartial();
    this.emitter.dispatchEvent(
      new CustomEvent('transcript', { detail: this.text }),
    );
  }
  setPartial(text: string) {
    this.partial = text;
    this.emitter.dispatchEvent(
      new CustomEvent('partial', { detail: this.partial }),
    );
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
  const [maxSentences, setMaxSentences] = useState(2);
  const [partial, setPartial] = useState('');
  useEffect(() => {
    sonix.transcript.emitter.addEventListener('transcript', (e) => {
      setTranscript((e as CustomEvent).detail);
    });
    sonix.transcript.emitter.addEventListener('partial', (e) => {
      setPartial((e as CustomEvent).detail);
    });
  }, []);
  // sentence is a group of words ending in a period, question mark, or exclamation point and followed by a space and a capital letter.
  let sliceSentences = (text: string) => {
    let sentences = text.split(/(?<=[.?!])\s+(?=[a-z])/gi);
    return sentences
      .slice(Math.max(sentences.length - maxSentences, 0))
      .join(' ');
  };
  return (
    <div>
      <p>{sliceSentences(transcript)}</p>
      <p>{partial}</p>
      <button onClick={() => sonix.start()}>Start</button>
      <button onClick={() => sonix.stop()}>End</button>
      <input
        type="number"
        value={maxSentences}
        onChange={(e) => setMaxSentences(parseInt(e.target.value))}
      />
    </div>
  );
};
