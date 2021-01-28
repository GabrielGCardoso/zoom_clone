class Business {
    constructor({ room, media, view, socketBuilder, peerBuilder }) {
        this.room = room;
        this.media = media;
        this.view = view;

        this.socketBuilder = socketBuilder;
        this.peerBuilder = peerBuilder;

        this.socket = {};
        this.currentStream = {};
        this.currentPeer = {};

        this.peers = new Map();
        this.usersRecordings = new Map();
    }

    static initialize(deps) {
        const instance = new Business(deps);
        return instance._init();
    }

    async _init() {
        this.view.configureRecordButton(this.onRecordPressed.bind(this));

        this.socket = this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .build();

        this.currentStream = await this.media.getCamera(true);
        // this.socketBuilder.emit('join-room', this.room, 'test01');

        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .setOnCallError(this.onPeerCallError())
            .setOnCallClose(this.onPeerCallClose())
            .build();

        this.addVideoStream(this.currentPeer.id);
    }

    addVideoStream(userId, stream = this.currentStream) {
        const recorderInstance = new Recorder(userId, stream);
        this.usersRecordings.set(recorderInstance.fileName, recorderInstance);
        if (this.recordingEnabled) {
            recorderInstance.startRecording();
        }

        const isCurrentUserId = false;
        this.view.renderVideo({
            userId,
            stream,
            isCurrentUserId,
        });
    }

    onUserConnected() {
        return (userId) => {
            console.log('user connected!', userId);
            this.currentPeer.call(userId, this.currentStream);
        };
    }

    onUserDisconnected() {
        return (userId) => {
            console.log('user disconnected!', userId);
            if (this.peers.has(userId)) {
                this.peers.get(userId).call.close();
                this.peers.delete(userId);
            }

            this.view.setParticipants(this.peers.size);
            this.view.removeVideoElement(userId);
        };
    }

    onPeerError() {
        return (error) => {
            console.log('error on peer', error);
        };
    }

    onPeerConnectionOpened() {
        return (peer) => {
            const id = peer.id;
            console.log('peer', peer);
            this.socket.emit('join-room', this.room, id);
            console.log('connection opened');
        };
    }

    onPeerCallReceived() {
        return (call) => {
            console.log('callReceived', call.peer);
            call.answer(this.currentStream);
        };
    }

    //fix problem from Peer lib when id called twice (one for audio and another for video)
    _callerIdHasAlreadyBeenReceived(callerId) {
        return !!this.peers.has(callerId);
    }

    onPeerStreamReceived() {
        return (call, stream) => {
            const callerId = call.peer;
            if (this._callerIdHasAlreadyBeenReceived(callerId)) return;
            this.addVideoStream(callerId, stream);

            //Maps is more semantic then objects and easier to manipulate
            this.peers.set(callerId, { call });
            this.view.setParticipants(this.peers.size);
        };
    }

    onPeerCallError() {
        return (call, error) => {
            console.log('an call error ocurred', error);
            this.view.removeVideoElement(call.peer);
        };
    }

    onPeerCallClose() {
        return (call) => {
            console.log('call closed', call.peer);
        };
    }

    onRecordPressed(recordingEnabled) {
        this.recordingEnabled = recordingEnabled;
        console.log('pressed', recordingEnabled);
        for (const [key, value] of this.usersRecordings) {
            if (this.recordingEnabled) {
                value.startRecording();
                continue;
            }
            this.stopRecording(key);
        }
    }

    // if users reconnect a couple of times
    // need to stop all recorders from this user
    async stopRecording(userId) {
        const usersRecordings = this.usersRecordings;
        for (const [key, value] of usersRecordings) {
            const isContextUser = key.includes(userId);
            if (!isContextUser) continue;

            const rec = value;
            const isRecordingActive = rec.recordingActive;
            if (!isRecordingActive) continue;

            await rec.stopRecording();
        }
    }
}
