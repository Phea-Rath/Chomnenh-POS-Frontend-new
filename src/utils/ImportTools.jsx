import React, { useState } from 'react';
import { Upload, Button, Table, Modal, Select, Space, Card, Typography, message, Tooltip, Popconfirm, Input, Switch, Divider, Tag, Checkbox } from 'antd';
import {
    UploadOutlined,
    CloudUploadOutlined,
    SettingOutlined,
    DeleteOutlined,
    ImportOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    LinkOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import apiService from '@/app/apiService';
import api from '../services/api';
import { LuFolderUp } from "react-icons/lu";
import baseUrl from '../services/baseUrl';
import { getToken } from '@/utils/tokenStore';
const { Text, Title } = Typography;
const importOptions = [
    {
        label: 'customers',
        keys: [
            'name',
            'email',
            'phone_number',
            'address',
        ],
        path:"/import/customers",
    },
    {
        label: 'suppliers',
        keys: [
            'name',
            'email',
            'phone_number',
            'address',
        ],
        path:"/import/suppliers",
    },
    {
        label: 'Products',
        keys: [
            'name',
            'price',
            'description',
            'category',
            'stock'
        ],
        path: "/import/products"
    }
]

/**
 * ImportTools Component
 * 
 * @param {Array} targetFields - Array of objects defining the fields to map.
 *                               Format: [{ label: 'Display Name', key: 'api_key', required: true }]
 * @param {string} apiPath - The relative API path to post data to.
 * @param {function} onSuccess - Callback function after successful import.
 * @param {string} token - Auth token for API calls.
 * @param {function} transformData - Optional function to transform data before posting.
 * @param {string} title - Custom title for the card.
 */
const ImportTools = ({
    targetFields = [],
    apiPath: initialApiPath = '',
    onSuccess,
    token = getToken(),
    transformData,
    title = "Import Data"
}) => {
    const [fileData, setFileData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [fieldConfig, setFieldConfig] = useState([]); // [{ header: string, key: string, enabled: boolean, label: string, required: boolean }]
    const [previewData, setPreviewData] = useState([]);
    const [activeColumns, setActiveColumns] = useState([]);
    const [isMappingVisible, setIsMappingVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [apiPath, setApiPath] = useState(initialApiPath);
    const [apiType, setApiType] = useState();
    const [typeOfImport, setTypeOfImport] = useState(false);

    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length > 0) {
                    const excelHeaders = jsonData[0].map(h => h ? String(h).trim() : '');
                    setHeaders(excelHeaders);
                    setFileData(jsonData.slice(1));
                    setFileName(file.name);

                    const initialConfig = excelHeaders.map((h, index) => {
                        const targetMatch = targetFields.find(f =>
                            f.label.toLowerCase() === h.toLowerCase() ||
                            f.key.toLowerCase() === h.toLowerCase()
                        );

                        return {
                            header: h,
                            headerIndex: index,
                            key: targetMatch ? targetMatch.key : h.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'),
                            label: targetMatch ? targetMatch.label : h,
                            type: targetMatch?.type || 'string',
                            enabled: !!targetMatch || (targetFields.length === 0),
                            required: targetMatch ? targetMatch.required : false
                        };
                    });

                    setFieldConfig(initialConfig);
                    setIsMappingVisible(true);
                } else {
                    message.error("The file is empty.");
                }
            } catch (err) {
                console.error("File parsing error:", err);
                message.error("Failed to parse file. Please ensure it's a valid Excel or CSV.");
            }
        };
        reader.readAsArrayBuffer(file);
        return false;
    };

    const downloadTemplate = () => {
        const headerRow = targetFields.length > 0 ? targetFields.map(f => f.label) : headers;
        const worksheet = XLSX.utils.aoa_to_sheet([headerRow]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_Template.xlsx`);
    };

    const applyMapping = () => {
        const enabledFields = fieldConfig.filter(f => f.enabled);

        if (enabledFields.length === 0) {
            message.warning("Please enable at least one column to import.");
            return;
        }

        const keys = enabledFields.map(f => f.key);
        if (new Set(keys).size !== keys.length) {
            message.error("Duplicate API keys detected. Each enabled column must have a unique key.");
            return;
        }

        const missingRequired = targetFields.filter(tf =>
            tf.required && !enabledFields.some(ef => ef.key === tf.key)
        );

        if (missingRequired.length > 0) {
            message.warning(`Missing required fields: ${missingRequired.map(f => f.label).join(', ')}`);
            return;
        }

        const mapped = fileData.map((row, index) => {
            const item = { key: `row-${index}-${Date.now()}` };
            enabledFields.forEach(field => {
                let val = row[field.headerIndex];

                if (val !== undefined && val !== null && val !== '') {
                    if (field.type === 'number') {
                        const num = Number(val);
                        val = isNaN(num) ? val : num;
                    } else if (field.type === 'string') {
                        val = String(val);
                    }
                } else {
                    val = null;
                }

                item[field.key] = val;
            });
            return item;
        }).filter(item => {
            return Object.keys(item).some(k => k !== 'key' && item[k] !== null && item[k] !== '');
        });

        setPreviewData(mapped);
        setActiveColumns(enabledFields);
        setIsMappingVisible(false);
        message.success(`Mapped ${mapped.length} records with ${enabledFields.length} fields.`);
    };

    const handleDeleteRow = (key) => {
        setPreviewData(prev => prev.filter(item => item.key !== key));
    };

    const handleImport = async () => {
        // if (!apiPath) {
        //     message.error("API path is not configured.");
        //     return;
        // }

        if (previewData.length === 0) {
            message.warning("No data to import.");
            return;
        }

        setLoading(true);
        try {
            let dataToPost = previewData.map(({ key, ...rest }) => rest);

            if (transformData) {
                dataToPost = transformData(dataToPost);
            }
            console.log("dataToPost : ", dataToPost);
            const path = typeOfImport ? apiPath: `${baseUrl}${apiType}`
            console.log("path : ", path);
            await api.post(path, { 'data': dataToPost },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    }
                }
            );

            message.success(`${previewData.length} records imported successfully!`);
            reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Import failed:", error);
            const errorMsg = error.response?.data?.message || error.message || "Internal Server Error";
            message.error("Import failed: " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFileData([]);
        setHeaders([]);
        setFieldConfig([]);
        setPreviewData([]);
        setFileName('');
    };

    const updateField = (index, updates) => {
        setFieldConfig(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const columns = [
        ...activeColumns.map(field => ({
            title: field.label,
            dataIndex: field.key,
            width: '200px',
            key: field.key,
            render: (text) => (text === null || text === undefined || text === '') ?
                <Text type="secondary"><i>N/A</i></Text> : text
        })),
        {
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 80,
            render: (_, record) => (
                <Tooltip title="Remove row">
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRow(record.key)}
                    />
                </Tooltip>
            ),
        }
    ];

    return (
        <Card
            title={
                <Space>
                    <ImportOutlined style={{ color: '#1890ff' }} />
                    <Title level={5} style={{ margin: 0 }}>{title}</Title>
                </Space>
            }
            extra={
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                        Get Template
                    </Button>
                    {previewData.length > 0 && (
                        <Popconfirm
                            title="Clear all imported data?"
                            onConfirm={reset}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button icon={<DeleteOutlined />} danger disabled={loading}>Clear All</Button>
                        </Popconfirm>
                    )}
                    <Upload
                        beforeUpload={handleFileUpload}
                        showUploadList={false}
                        accept=".xlsx,.xls,.csv"
                    >
                        <Button icon={<UploadOutlined />} type={previewData.length === 0 ? "primary" : "default"}>
                            {fileName ? `File: ${fileName}` : "Select Excel/CSV"}
                        </Button>
                    </Upload>
                </Space>
            }
        >
            {previewData.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#e6f7ff',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #91d5ff'
                    }}>
                        <div>
                            <Text strong>Previewing Data: </Text>
                            <Text type="primary" strong>{previewData.length} records</Text>
                            <Text type="secondary" style={{ marginLeft: '12px', fontSize: '12px' }}>
                                <ExclamationCircleOutlined /> Review the data before confirming.
                            </Text>
                        </div>
                        <Space>
                            <Button icon={<SettingOutlined />} onClick={() => setIsMappingVisible(true)}>
                                Edit Keys & Mapping
                            </Button>
                            <Popconfirm
                                title={`Are you sure you want to import ${previewData.length} records?`}
                                onConfirm={handleImport}
                                okText="Import"
                                cancelText="Cancel"
                                disabled={loading}
                            >
                                <Button
                                    type="primary"
                                    icon={<CloudUploadOutlined />}
                                    loading={loading}
                                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Confirm Import
                                </Button>
                            </Popconfirm>
                        </Space>
                    </div>

                    <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                        <Checkbox checked={typeOfImport} onChange={(e) => setTypeOfImport(e.target.checked)}>Use API Path</Checkbox>
                        <div className='flex gap-2 flex-wrap'>
                            {typeOfImport&& <Space align="center">
                                <LinkOutlined style={{ color: '#8c8c8c' }} />
                                <Text strong>API Path(optional):</Text>
                                <Input
                                    placeholder="e.g., products/bulk"
                                    value={apiPath}
                                    onChange={(e) => setApiPath(e.target.value)}
                                    style={{ width: '300px' }}
                                    addonBefore="http://.../api/"
                                />
                            </Space>}
                            {!typeOfImport&&<Space align="center">
                                <LuFolderUp style={{ color: '#8c8c8c' }} />
                                <Text strong>Choose options:</Text>
                                <Select
                                    placeholder="Select Resource Type"
                                    value={apiType}
                                    onChange={(value) => setApiType(value)}
                                    style={{ width: '250px' }}
                                >
                                    {
                                        importOptions.map((option) => (
                                            <Option key={option.label} value={option.path}>
                                                {option.label}
                                            </Option>
                                        ))
                                    }
                                </Select>
                            </Space>}
                        </div>
                        {!typeOfImport && <div className='flex gap-3 mt-2 flex-wrap'>
                            {apiType && importOptions.find(option => option.path == apiType).keys.map((key) => (
                                <Tag key={key}>{key}</Tag>
                            ))}
                        </div>}
                    </div>

                    <Table
                        dataSource={previewData}
                        columns={columns}
                        size="small"
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ x: 'max-content', y: 500 }}
                        bordered
                    />
                </Space>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '8px',
                    background: '#fafafa'
                }}>
                    <UploadOutlined style={{ fontSize: '56px', color: '#bfbfbf', marginBottom: '20px' }} />
                    <div>
                        <Title level={4} type="secondary">Upload your data file</Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                            Drag and drop an Excel (.xlsx, .xls) or CSV file here, or click the button above.
                        </Text>
                    </div>
                    <div style={{ marginTop: '24px' }}>
                        <Button type="link" icon={<DownloadOutlined />} onClick={downloadTemplate}>
                            Download a blank template
                        </Button>
                    </div>
                </div>
            )}

            <Modal
                title={
                    <Space>
                        <SettingOutlined style={{ color: '#1890ff' }} />
                        <span>Customize Key Fields & Mapping</span>
                    </Space>
                }
                open={isMappingVisible}
                onOk={applyMapping}
                onCancel={() => setIsMappingVisible(false)}
                width={800}
                okText="Apply & Preview"
                cancelText="Cancel"
                destroyOnClose
                maskClosable={false}
            >
                <div style={{ marginBottom: '20px' }}>
                    <Text type="secondary">
                        Below are all columns found in your file. Use the <strong>API Key</strong> field to customize the property name sent to the server.
                    </Text>
                </div>
                <div style={{ background: '#f0f2f5', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <Checkbox checked={typeOfImport} onChange={(e) => setTypeOfImport(e.target.checked)}>Use API Path</Checkbox>
                    {typeOfImport && <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                            <LinkOutlined />
                            <Text strong>Destination API Path:</Text>
                            <Input
                                placeholder="api/path/here"
                                value={apiPath}
                                onChange={(e) => setApiPath(e.target.value)}
                                style={{ width: '250px' }}
                            />
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>This path will be used for the POST request.</Text>
                    </Space>}
                    {!typeOfImport && <div>
                        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                                <LuFolderUp />
                                <Text strong>Choose option:</Text>
                                <Select
                                    placeholder="Select Resource Type"
                                    value={apiType}
                                    onChange={(value) => setApiType(value)}
                                    style={{ width: '250px' }}
                                >
                                    {
                                        importOptions.map((option) => (
                                            <Option key={option.label} value={option.path}>
                                                {option.label}
                                            </Option>
                                        ))
                                    }
                                </Select>
                            </Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>This key will be used for the POST request.</Text>
                        </Space>
                        <div className='flex gap-3 mt-2 flex-wrap'>
                            {apiType && importOptions.find(option => option.path == apiType).keys.map((key) => (
                                <Tag key={key}>{key}</Tag>
                            ))}
                        </div>
                    </div>}
                </div>


                <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div style={{ display: 'flex', marginBottom: '12px', padding: '0 12px', color: '#8c8c8c', fontSize: '11px', fontWeight: 'bold' }}>
                        <div style={{ width: '10%', textAlign: 'center' }}>IMPORT</div>
                        <div style={{ width: '30%' }}>FILE COLUMN (HEADER)</div>
                        <div style={{ width: '40%' }}>API KEY</div>
                        <div style={{ width: '20%' }}>DATA TYPE</div>
                    </div>

                    <Divider style={{ margin: '8px 0' }} />

                    {fieldConfig.map((field, index) => (
                        <div key={`config-${index}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px',
                            padding: '8px 12px',
                            background: field.enabled ? '#fff' : '#fafafa',
                            borderRadius: '6px',
                            border: field.enabled ? '1px solid #d9d9d9' : '1px solid #f0f0f0',
                            opacity: field.enabled ? 1 : 0.6
                        }}>
                            <div style={{ width: '10%', textAlign: 'center' }}>
                                <Switch
                                    size="small"
                                    checked={field.enabled}
                                    onChange={(checked) => updateField(index, { enabled: checked })}
                                />
                            </div>
                            <div style={{ width: '30%', paddingRight: '16px' }}>
                                <Text strong style={{ color: field.enabled ? 'inherit' : '#bfbfbf' }}>{field.header || <Text type="secondary" italic>No Header</Text>}</Text>
                                {field.required && <Text type="danger" style={{ marginLeft: '4px' }}>*</Text>}
                                <div style={{ fontSize: '10px', color: '#bfbfbf' }}>Index: {field.headerIndex}</div>
                            </div>
                            <div style={{ width: '40%', paddingRight: '8px' }}>
                                <Input
                                    size="small"
                                    placeholder="Enter API key"
                                    value={field.key}
                                    disabled={!field.enabled}
                                    onChange={(e) => updateField(index, { key: e.target.value, label: e.target.value })}
                                    style={{ borderRadius: '4px' }}
                                    prefix={<SettingOutlined style={{ color: '#bfbfbf' }} />}
                                />
                            </div>
                            <div style={{ width: '20%' }}>
                                <Select
                                    size="small"
                                    style={{ width: '100%' }}
                                    value={field.type || 'string'}
                                    disabled={!field.enabled}
                                    onChange={(val) => updateField(index, { type: val })}
                                >
                                    <Select.Option value="string">String</Select.Option>
                                    <Select.Option value="number">Number</Select.Option>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </Card>
    );
};

export default ImportTools;
