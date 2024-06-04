import { useState, useEffect, useCallback } from 'react';
import { Document, Packer, Paragraph, ExternalHyperlink, TextRun, ImageRun, UnderlineType, } from 'docx';
import html2canvas from 'html2canvas';
import * as FileSaver from 'file-saver';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { $t } from '../../i18n';
import { useInject } from '../../utils/di';
import { convertColorToHex } from '../../utils/convertColorToHex';
import { FileService } from '../../services/FileService';
import { Select } from './Select';
import Close from './close.svg';
import { nutstoreClient } from '../../utils/NutstoreSDK';
import { calculateEnlargedImageBase64 } from '../../utils/calculateEnlargedImageBase64';
import './style.scss';
export const Export = (props) => {
    const { clickCallback, setIsShowExportLoading } = props;
    const [format, setFormat] = useState('PNG');
    const [scale, setScale] = useState(1);
    const [isClient, setIsClient] = useState(false);
    const [featureRestrictionEnabled, setFeatureRestrictionEnabled] = useState(false);
    const fileService = useInject(FileService);
    const checkWhetherRunVipFeatures = useCallback(() => {
        return new Promise(async (resolve) => {
            let isVip;
            if (isClient && featureRestrictionEnabled && nutstoreClient.isPayingUser) {
                isVip = await nutstoreClient.isPayingUser();
            }
            else {
                isVip = false;
            }
            if (isClient && featureRestrictionEnabled && !isVip && nutstoreClient.showPricingPlans) {
                nutstoreClient.showPricingPlans();
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    }, [isClient, featureRestrictionEnabled]);
    const handleExportPng = useCallback(() => {
        const executeExport = async () => {
            setIsShowExportLoading(true);
            const node = document.getElementsByClassName('ProjectNodeList')[0];
            try {
                await htmlToImage.toPng(node).then(async (dataUrl) => {
                    const base64 = (await calculateEnlargedImageBase64(dataUrl, scale, 20));
                    const link = document.createElement('a');
                    link.download = `${props.fileName}.png`;
                    link.href = base64;
                    link.click();
                });
            }
            catch (e) {
            }
            finally {
                setIsShowExportLoading(false);
            }
        };
        if (scale === 1) {
            void executeExport();
        }
        else {
            void checkWhetherRunVipFeatures().then((run) => {
                if (!run) {
                    return;
                }
                void executeExport();
            });
        }
    }, [checkWhetherRunVipFeatures, scale, props.fileName]);
    const handleExportWord = useCallback(async () => {
        void checkWhetherRunVipFeatures().then(async (run) => {
            if (!run) {
                return;
            }
            setIsShowExportLoading(true);
            try {
                const data = props.noneNestedNodeList.map(item => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(item.content, 'text/html');
                    const words = [];
                    const body = doc.querySelector('body');
                    for (const node of body.childNodes) {
                        const search = (node, styles) => {
                            if (node.nodeType === 1) {
                                const _node = node;
                                const newStyles = { ...styles };
                                if (_node.style.color) {
                                    newStyles.color = _node.style.color;
                                }
                                if (_node.tagName === 'U') {
                                    newStyles.underline = true;
                                }
                                else if (_node.tagName === 'DEL') {
                                    newStyles.delete = true;
                                }
                                else if (_node.tagName === 'STRONG') {
                                    newStyles.strong = true;
                                }
                                else if (_node.tagName === 'EM') {
                                    newStyles.emphasis = true;
                                }
                                else if (_node.tagName === 'A') {
                                    newStyles.hyperlink = _node.getAttribute('href');
                                }
                                node.childNodes.forEach(child => {
                                    search(child, newStyles);
                                });
                            }
                            else {
                                const _node = node;
                                const word = {
                                    ...styles,
                                    text: _node.textContent,
                                };
                                words.push(word);
                            }
                        };
                        search(node, {});
                    }
                    return {
                        words,
                        level: item.depth,
                        images: item.images,
                    };
                });
                const children = [];
                const promises = [];
                for (let i = 0; i < data.length; ++i) {
                    const item = data[i];
                    const ch = [];
                    item.words.forEach(word => {
                        const text = new TextRun({
                            text: word.text,
                            bold: word.strong || false,
                            italics: word.emphasis || false,
                            strike: word.delete || false,
                            color: convertColorToHex(word.color || '000000'),
                            underline: word.underline
                                ? {
                                    type: UnderlineType.SINGLE,
                                    color: '000000',
                                }
                                : undefined,
                        });
                        ch.push(word.hyperlink
                            ? new ExternalHyperlink({
                                children: [text],
                                link: word.hyperlink,
                            })
                            : text);
                    });
                    promises.push(new Promise(async (resolve) => {
                        const _promises = [];
                        if (item.images && item.images.length > 0) {
                            for (const image of item.images) {
                                const url = image.type === 'httpLink'
                                    ? image.data.link
                                    : (await fileService.getPreviewLink(image.data)) || '';
                                _promises.push(new Promise(async (resolve) => {
                                    const res = await fetch(url);
                                    const blob = await res.blob();
                                    const reader = new FileReader();
                                    reader.readAsArrayBuffer(blob);
                                    reader.onload = () => {
                                        const arrayBuffer = reader.result;
                                        const img = new Image();
                                        img.onload = () => {
                                            const imageRun = new ImageRun({
                                                data: arrayBuffer,
                                                transformation: {
                                                    width: img.width,
                                                    height: img.height,
                                                },
                                            });
                                            ch.push(imageRun);
                                            resolve(true);
                                        };
                                        img.src = url;
                                    };
                                }));
                            }
                        }
                        await Promise.all(_promises).then(() => {
                            children[i] = new Paragraph({
                                children: ch,
                                bullet: {
                                    level: item.level,
                                },
                            });
                            resolve(true);
                        });
                    }));
                }
                await Promise.all(promises).then(async () => {
                    const doc = new Document({
                        sections: [
                            {
                                children,
                            },
                        ],
                    });
                    await Packer.toBlob(doc).then(blob => {
                        FileSaver.saveAs(blob, `${props.fileName}.docx`);
                    });
                });
            }
            catch (e) {
            }
            finally {
                setIsShowExportLoading(false);
            }
        });
    }, [checkWhetherRunVipFeatures, props.fileName, props.noneNestedNodeList]);
    const handleExportPdf = useCallback(async () => {
        void checkWhetherRunVipFeatures().then(async (run) => {
            if (!run) {
                return;
            }
            setIsShowExportLoading(true);
            try {
                const target = document.getElementsByClassName('ProjectNodeList__RootWrapper')[0];
                const rect = target.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                await html2canvas(target).then(canvas => {
                    const pdf = new jsPDF({
                        orientation: width > height ? 'l' : 'p',
                        unit: 'px',
                        format: [width, height],
                        compress: true,
                    });
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
                    pdf.save(`${props.fileName}.pdf`);
                });
            }
            catch (e) {
            }
            finally {
                setIsShowExportLoading(false);
            }
        });
    }, [checkWhetherRunVipFeatures, props.fileName]);
    const handleClose = () => {
        clickCallback();
    };
    const handleConfirm = async () => {
        clickCallback();
        if (format === 'PNG') {
            await handleExportPng();
        }
        else if (format === 'Word') {
            await handleExportWord();
        }
        else if (format === 'PDF') {
            await handleExportPdf();
        }
    };
    useEffect(() => {
        const _isClient = nutstoreClient.isElectronClient;
        setIsClient(_isClient);
        if (_isClient && nutstoreClient.getFeatureRestrictionEnabled) {
            void nutstoreClient.getFeatureRestrictionEnabled().then(enabled => setFeatureRestrictionEnabled(enabled));
        }
        else {
            setFeatureRestrictionEnabled(false);
        }
    }, []);
    return (React.createElement("div", { className: "export-panel-container" },
        React.createElement("div", { className: "export-panel" },
            React.createElement("div", { className: "export-panel-header" },
                React.createElement("div", { className: "export-panel-header-title" }, $t('NUTFLOWY_EXPORT_FILES')),
                React.createElement("div", { className: "export-panel-header-close", onClick: handleClose },
                    React.createElement(Close, null))),
            React.createElement("div", { className: "export-panel-body" },
                React.createElement("div", { className: "export-panel-select-container", style: {
                        top: 24,
                    } },
                    React.createElement("div", null,
                        $t('NUTFLOWY_EXPORT_FORMAT'),
                        "\uFF1A"),
                    React.createElement(Select, { defaultValue: {
                            item: format,
                            vip: format !== 'PNG',
                        }, items: [
                            {
                                item: 'PNG',
                                vip: false
                            }, {
                                item: 'PDF',
                                vip: true
                            }, {
                                item: 'Word',
                                vip: true
                            }
                        ], changeCallback: (value) => {
                            setFormat(value);
                        } })),
                format === 'PNG' && (React.createElement("div", { className: "export-panel-select-container", style: {
                        top: 72,
                    } },
                    React.createElement("div", null,
                        $t('NUTFLOWY_EXPORT_SCALE'),
                        "\uFF1A"),
                    React.createElement(Select, { defaultValue: {
                            item: scale + '00%',
                            vip: scale !== 1,
                        }, items: [
                            {
                                item: '100%',
                                vip: false
                            }, {
                                item: '200%',
                                vip: true
                            }, {
                                item: '300%',
                                vip: true
                            }
                        ], changeCallback: (value) => {
                            setScale(Number(value[0]));
                        } })))),
            React.createElement("div", { className: "export-buttons" },
                React.createElement("div", { className: "export-button-confirm", onClick: handleConfirm }, $t('NUTFOLWY_CONFIRM')),
                React.createElement("div", { className: "export-button-cancel", onClick: handleClose }, $t('NUTFOLWY_CANCEL'))))));
};
