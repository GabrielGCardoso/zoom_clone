class View {
    constructor() {
        this.recorderBtn = document.getElementById('record');
        this.leaveBtn = document.getElementById('leave');
    }

    createVideoElement({ muted = true, src, srcObject }) {
        const video = document.createElement('video');
        video.muted = muted;
        video.src = src;
        video.srcObject = srcObject;

        if (src) {
            video.controls = true;
            video.loop = true;
            Utils.sleep(200).then(() => video.play());
        }

        if (srcObject) {
            video.addEventListener('loadedmetadata', (_) => video.play());
        }

        return video;
    }

    renderVideo({
        userId,
        stream = null,
        url = null,
        isCurrentUserId = false,
        // muted = true,
    }) {
        const video = this.createVideoElement({
            muted: isCurrentUserId,
            src: url,
            srcObject: stream,
        });
        this.appendToHtmlTree(userId, video, isCurrentUserId);
    }

    appendToHtmlTree(userId, video, isCurrentUserId) {
        const div = document.createElement('div');
        div.id = userId;
        div.classList.add('wrapper');
        div.append(video);
        const div2 = document.createElement('div');
        // show the name if is not the current user
        div2.innerText = isCurrentUserId ? '' : userId;
        div.append(div2);

        const videoGrid = document.getElementById('video-grid');
        videoGrid.append(div);
    }

    setParticipants(count) {
        const myself = 1;
        const participants = document.getElementById('participants');
        participants.innerHTML = count + myself;
    }

    removeVideoElement(id) {
        const element = document.getElementById(id);
        element.remove();
    }

    toggleRecordingButtonColor(isActive = true) {
        this.recorderBtn.style.color = isActive ? 'red' : 'white';
    }

    onRecordClick(command) {
        this.recordingEnabled = false;
        return () => {
            const isActive = (this.recordingEnabled = !this.recordingEnabled);

            command(this.recordingEnabled);
            this.toggleRecordingButtonColor(isActive);
        };
    }

    onLeaveClick(command) {
        return async () => {
            command();
            await Utils.sleep(1000);
            window.location = '/pages/home';
        };
    }

    configureRecordButton(command) {
        // const recordBtn = document.getElementById('record');
        this.recorderBtn.addEventListener('click', this.onRecordClick(command));
    }

    configureLeaveButton(command) {
        this.leaveBtn.addEventListener('click', this.onLeaveClick(command));
    }
}
