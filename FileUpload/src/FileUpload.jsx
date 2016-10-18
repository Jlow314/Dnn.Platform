import React, {Component, PropTypes} from "react";
import ReactDOM from "react-dom";
import LinkInput from "./LinkInput";
import Browse from "./Browse/Browse";
import UploadBar from "./UploadBar";

import "./style.less";

const Buttons = [
    { name: "browse", text: "Browse Filesystem" },
    { name: "upload", text: "Upload a File" },
    { name: "link", text: "Enter URL Link" }
];

const DefaultText = "Drag and Drop a File or Select an Option";
const onDragOverText = "Drag and Drop a File";

const acceptFormats = ["jpeg", "png", "bmp", "ico", "svg"];

export default class FileUpload extends Component {
    constructor(props) {
        super(props);
        let imagePath = "";
        let imageExist = false;
        let selectedFile = null;
        let selectedFolder = null;

        if (this.props.imagePath) {
            imagePath = "/Portals/0/" + this.props.imagePath;
            this.getImageDimensions(imagePath);
            imageExist = true;
            const path = this.getPathObjFormString(imagePath);
            selectedFolder = { value: path.folder };
            selectedFile = { value: path.file };
        }

        this.state = {
            text: DefaultText,
            showLinkInput: false,
            showFolderPicker: false,

            selectedFile,
            selectedFolder,

            linkPath: "",
            imagePath,

            imageExist,
            draggedOver: false,
            isDragging: false,

            fileName: "",

            uploading: false,
            uploadComplete: false,
            horizontalOrientation: false,

            errorText: ""
        };
        setTimeout(this.compareDimensions.bind(this), 2000);
    }

    getPathObjFormString(path) {
        const pathArray = path.split("/");
        let folder = pathArray.length > 1 ? pathArray[pathArray.length - 2] : "";
        const file = pathArray[pathArray.length - 1].split("?")[0];
        return { folder, file };
    }

    componentDidMount() {
        window.addEventListener("dragover", this.prevent);
        window.addEventListener("drop", this.prevent);
    }

    prevent(e) {
        e.preventDefault();
    }

    componentWillUnmount() {
        window.removeEventListener("dragover", this.prevent);
        window.removeEventListener("drop", this.prevent);
    }

    onLink() {
        if (window.dnn !== undefined) {
            window.dnn.stopEscapeFromClosingPB = true;
        }
        this.setState({ showLinkInput: true });
    }

    onBrowse() {
        if (window.dnn !== undefined) {
            window.dnn.stopEscapeFromClosingPB = true;
        }
        this.setState({ showFolderPicker: true });
    }

    onButtonClick(action) {
        switch (action) {
            case "link":
                return this.onLink();
            case "browse":
                return this.onBrowse();
        }
    }

    hideFields() {
        if (window.dnn !== undefined) {
            window.dnn.stopEscapeFromClosingPB = false;
        }
        this.setState({ showLinkInput: false, showFolderPicker: false });
    }

    onMouseEnter(text) {
        this.setState({ text });
    }

    onMouseLeave() {
        this.setState({ text: DefaultText });
    }

    onFileSelect(selectedFolder, selectedFile) {
        this.setState({ selectedFolder, selectedFile }, this.getImagePath);
        this.hideFields();
    }


    handleImageError() {
        this.setState({ imageExist: false });
    }

    onFileUpload(e) {
        this.uploadFile(e.target.files[0]);
    }

    handleError(error) {
        const errorText = error && typeof error === "string" ? error : "Upload Failed";
        this.setState({ uploading: true, errorText }, () => {
            setTimeout(() => {
                this.setState({ uploading: false, errorText: "" });
            }, 2000);
        });
    }

    uploadFile(file) {
        let format = file.type;
        const isImage = file.type.indexOf("image/") !== -1;
        if (!isImage) {
            return this.handleError("wrong format");
        }
        format = format.split("image/")[1];

        const fileFormats = this.props.fileFormats || acceptFormats;
        const isAcceptFormat = fileFormats.some(f => format.indexOf(f) !== -1);
        if (!isAcceptFormat) {
            return this.handleError("wrong image format");
        }
        this.setState({ fileName: file.name });
        this.postFile(file);
    }

    getServiceFramework() {
        let sf = this.props.utils.utilities.sf;
        sf.controller = "FileUpload";
        sf.moduleRoot = "InternalServices";
        return sf;
    }

    setImagePath(imagePath, isLink) {
        this.setState({ imagePath: "" });
        this.getImageDimensions(imagePath);

        if (isLink) {
            this.uploadFromUrl(imagePath);
            this.hideFields();
        } else {
            this.setState({ imagePath, imageExist: true }, this.sendResult.bind(this));
        }
    }

    sendResult() {
        let path = this.state.imagePath.replace("/Portals/0/", "");
        let fileId = this.state.selectedFile ? this.state.selectedFile.fileId || +this.state.selectedFile.key : null;
        this.props.onImageSelect({ path, fileId });
    }


    uploadFromUrl(url) {
        const folder = this.props.folderName && typeof this.props.folderName === "string" ? this.props.folderName : "";
        const sf = this.getServiceFramework();
        sf.post("UploadFromUrl", { url, folder }, this.uploadComplete.bind(this), this.handleError.bind(this));
        this.setState({ uploading: true, uploadComplete: false });
    }

    getImagePath() {
        const fileId = this.state.selectedFile ? this.state.selectedFile.key : "";
        if (!fileId) {
            this.setState({ imagePath: "", imageExist: false }, this.sendResult.bind(this));
        } else {
            const sf = this.getServiceFramework();
            sf.get("loadimage", { fileId }, this.setImagePath.bind(this), this.callback);
        }
    }

    getImageDimensions(src) {
        let tempImage = new Image();
        tempImage.src = src;
        tempImage.onload = this.compareDimensions.bind(this, tempImage);
    }

    compareDimensions(image) {
        if (!image) {
            return;
        }
        const componentDimension = ReactDOM.findDOMNode(this).getBoundingClientRect();

        if (image.height && image.width / image.height > componentDimension.width / componentDimension.height) {
            this.setState({ horizontalOrientation: true });
        } else {
            this.setState({ horizontalOrientation: false });
        }
    }

    postFile(file) {
        const formData = new FormData();
        formData.append("postfile", file);
        const sf = this.getServiceFramework();
        if (this.props.folderName && typeof this.props.folderName === "string") {
            formData.append("folder", this.props.folderName);
        }
        sf.postfile("UploadFromLocal", formData, this.uploadComplete.bind(this), this.handleError.bind(this));
        this.setState({ uploading: true, uploadComplete: false });
    }

    uploadComplete(res) {
        this.setState({ uploadComplete: true }, () => {
            setTimeout(() => {
                this.setState({ uploading: false });
            }, 1000);
        });
        const response = typeof res === "string" ? JSON.parse(res) : res;
        if (!response.path) {
            return;
        }
        const pathObj = this.getPathObjFormString(response.path);
        const selectedFile = { value: pathObj.file, fileId: response.fileId };
        const selectedFolder = { value: pathObj.folder };
        this.setState({ selectedFile, selectedFolder }, this.setImagePath.bind(this, response.path));
    }

    callback(result) {
        console.log('2222222222', result);
    }

    onDragOver() {
        this.setState({ draggedOver: true, text: onDragOverText });
    }

    onDragLeave() {
        this.setState({ draggedOver: false, text: DefaultText });
    }

    onDrop(e) {
        e.preventDefault();
        this.uploadFile(e.dataTransfer.files[0]);
        this.onDragLeave();
    }

    getImageStyle() {
        const {cropImage} = this.props;
        const {horizontalOrientation} = this.state;
        let style = { width: "100%", height: "auto" };

        if (horizontalOrientation && cropImage) {
            style = { height: "100%", width: "auto" };
        }
        if (!horizontalOrientation && !cropImage) {
            style = { height: "100%", width: "auto" };
        }
        return style;
    }

    render() {
        let buttons = Buttons;
        if (this.props.buttons) {
            buttons = buttons.filter((button) => {
                return this.props.buttons.some((propButton) => {
                    return button.name === propButton;
                });
            });
        }

        buttons = buttons.map((button) => {
            const svg = require(`!raw!./img/${button.name}.svg`);
            const isUpload = button.name === "upload";
            /* eslint-disable react/no-danger */
            const accept = acceptFormats.map(format => "image/" + format).join(",");
            return <div
                className={"button " + button.name}
                onMouseEnter={this.onMouseEnter.bind(this, button.text) }
                onMouseLeave={this.onMouseLeave.bind(this) }
                onClick={this.onButtonClick.bind(this, button.name) }
                key={button.name}>
                <div dangerouslySetInnerHTML={{ __html: svg }} />
                {isUpload && <input type="file" accept={accept} onChange={this.onFileUpload.bind(this) } />}
            </div>;
        });

        const buttonsStyle = { width: buttons.length * 67 };
        const src = this.state.imagePath || "";
        const showImage = src && this.state.imageExist && !this.state.showLinkInput && !this.state.showFolderPicker;
        let className = "overlay" + (src && this.state.imageExist ? " has-image" : "") + (this.state.draggedOver ? " hover" : "");


        return <div className="dnn-file-upload">
            <div>
                <div
                    id="dropzoneId"
                    className={className}
                    onDragOver={this.onDragOver.bind(this) }
                    onDragLeave={this.onDragLeave.bind(this) }
                    onDrop={this.onDrop.bind(this) }
                    >
                    <div className="buttons" style={buttonsStyle}>
                        {buttons}
                    </div>
                    <span>{this.state.text}</span>
                </div>

                {this.state.showLinkInput && <LinkInput
                    linkPath={this.state.linkPath}
                    onSave={this.setImagePath.bind(this) }
                    onCancel={this.hideFields.bind(this) }/>}
                {this.state.showFolderPicker && <Browse
                    utils={this.props.utils}
                    selectedFolder={this.state.selectedFolder}
                    selectedFile={this.state.selectedFile}
                    onSave={this.onFileSelect.bind(this) }
                    onCancel={this.hideFields.bind(this) } />}
                {showImage && <div className="image-container">
                    <img
                        style={this.getImageStyle() }
                        onError={this.handleImageError.bind(this) }
                        src={src}/></div>}
            </div>
            {this.state.uploading && <UploadBar uploadComplete={this.state.uploadComplete} errorText={this.state.errorText} fileName={this.state.fileName}/>}
        </div>;
    }
}


FileUpload.propTypes = {
    //---REQUIRED PROPS---
    utils: PropTypes.object.isRequired,
    onImageSelect: PropTypes.func.isRequired,
    imagePath: PropTypes.string,


    //---OPTIONAL PROPS---
    cropImage: PropTypes.bool,
    buttons: PropTypes.array,
    folderName: PropTypes.string,
    fileFormats: PropTypes.array
};

