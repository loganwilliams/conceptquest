import React, { Component } from "react";

class BackgroundMusic extends Component {
  componentDidMount = () => {
    // We have to use WebAudio in order to have seamless audio looping.
    // HTML 5 audio cannot loop without a playback gap! :(
    let audioContext = new AudioContext();

    // Make an audio source and a gain.
    var source = audioContext.createBufferSource();
    let gainNode = audioContext.createGain();

    // This is the non-deprecated way to set an AudioParameter.
    gainNode.gain.setTargetAtTime(0.0, audioContext.currentTime + 0.001, 0.001);
    // Wire it up.
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    let playLoop = buffer => {
      source.buffer = buffer;

      // Start playing and fade volume in slowly.
      gainNode.gain.setTargetAtTime(0.5, audioContext.currentTime + 3, 3);
      source.start(0);
      source.loop = true;
    };

    // Download the audio file with an XMLHttpRequest. Old school!
    var request = new XMLHttpRequest();
    request.open("GET", this.props.src, true);
    request.responseType = "arraybuffer";

    request.onload = () => {
      audioContext.decodeAudioData(request.response, playLoop, () => {
        console.error("Decoding failed.");
      });
    };

    request.send();
  };

  // We do all of the audio playback in componentDidMount.
  render = () => {
    return <div className="BackgroundMusic" />;
  };
}

export default BackgroundMusic;
