import * as RecordRTC from 'recordrtc';
import { useRef } from 'react';
import { ClientEndStreamMessage } from './types/sonix';
export class Microphone {
  status: string;
  recorder: RecordRTC | null = null;
  sendAudio: (audio: Blob) => void;
  constructor(sendAudio: (blob: Blob) => void) {
    this.status = 'waiting';
    this.sendAudio = sendAudio;
  }

  async turnOnMicrophone() {
    let userMedia = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    this.recorder = new RecordRTC(userMedia, {
      type: 'audio',
      mimeType: 'audio/webm',
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 1,
      timeSlice: 500,
      desiredSampRate: 16000,
      ondataavailable: (blob) => {
        console.log(blob);
        this.sendAudio(blob);
      },
    });
    this.recorder.startRecording();
    this.status = 'recording';
  }
  stopRecording() {
    this.status = 'finalizing';
    this.recorder?.stopRecording(() => {
      this.recorder?.stopRecording();
    });
  }
}
