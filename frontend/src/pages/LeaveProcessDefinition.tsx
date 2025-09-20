import React, { useState, useEffect, useRef } from 'react'
import { Card, Table, Button, message, Divider, Tag, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileTextOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { processApi } from '../api/processApi'
import type { ProcessDefinition } from '../entity/ProcessDefinition'
import BpmnViewer from 'bpmn-js/lib/Viewer'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

const LeaveProcessDefinition: React.FC = () => {
  const [processDefinitions, setProcessDefinitions] = useState<ProcessDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDefinition, setSelectedDefinition] = useState<ProcessDefinition | null>(null)
  const [xmlModalVisible, setXmlModalVisible] = useState(false)
  const [diagramModalVisible, setDiagramModalVisible] = useState(false)
  const [bpmnXml, setBpmnXml] = useState('')
  const diagramRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<BpmnViewer | null>(null)

  // 模拟从本地文件加载流程定义
  const loadProcessDefinitions = async () => {
    setLoading(true)
    try {
      // 模拟加载本地的leave-process.bpmn文件
      // 在实际环境中，这可能需要通过API从后端获取

      processApi.getProcessDefinitions().then((data) => {
        setProcessDefinitions(data)
        message.success('流程定义加载成功')
      })
    } catch (error) {
      console.error('加载流程定义失败:', error)
      message.error('加载流程定义失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看流程定义详情
  const viewProcessDefinition = (definition: ProcessDefinition) => {
    setSelectedDefinition(definition)
  }

  // 查看流程XML
  const viewProcessXml = async () => {
    if (!selectedDefinition) return
    
    try {
      setLoading(true)
      const xml = await processApi.getProcessDefinitionXml(selectedDefinition.id)
      setBpmnXml(xml)
      setXmlModalVisible(true)
    } catch (error) {
      console.error('获取流程XML失败:', error)
      message.error('获取流程XML失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看流程图
  const viewProcessDiagram = async () => {
    if (!selectedDefinition) return
    
    try {
      setLoading(true)
      const xml = await processApi.getProcessDefinitionXml(selectedDefinition.id)
      setBpmnXml(xml)
      setDiagramModalVisible(true)
      // 直接调用渲染函数，而不依赖useEffect触发
      setTimeout(() => {
        renderBpmnDiagram()
      }, 0)
    } catch (error) {
      console.error('获取流程图失败:', error)
      message.error('获取流程图失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化BPMN查看器并渲染流程图
  const renderBpmnDiagram = () => {
    if (!diagramRef.current || !bpmnXml) return
    
    // 确保容器为空
    diagramRef.current.innerHTML = ''
    
    // 销毁已存在的viewer实例
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy()
      } catch (error) {
        console.warn('销毁viewer实例失败:', error)
      }
      viewerRef.current = null
    }
    
    // 创建新的viewer实例
    viewerRef.current = new BpmnViewer({
      container: diagramRef.current,
      width: '100%',
      height: '100%'
    })
    
    // 导入BPMN XML
    viewerRef.current.importXML(bpmnXml).then(() => {
      // 使图适应容器
      viewerRef.current?.get('canvas').zoom('fit-viewport')
    }).catch((error: Error) => {
      console.error('解析BPMN XML失败:', error)
      message.error('解析流程图失败')
    })
  }

  // 刷新流程定义
  const refreshProcessDefinitions = () => {
    loadProcessDefinitions()
  }

  // 表格列定义
  const columns: ColumnsType<ProcessDefinition> = [
    {
      title: '流程定义名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '流程定义ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
    },
    {
      title: '流程定义键',
      dataIndex: 'key',
      key: 'key',
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '部署时间',
      dataIndex: 'deploymentTime',
      key: 'deploymentTime',
      render: (time) => {
        return new Date(time).toLocaleString('zh-CN')
      }
    },
    {
      title: '状态',
      dataIndex: 'suspend',
      key: 'status',
      render: (suspend) => {
        return suspend ? (
          <Tag color="error">已挂起</Tag>
        ) : (
          <Tag color="success">激活</Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewProcessDefinition(record)}
        >
          查看详情
        </Button>
      ),
    },
  ]

  // 组件挂载时加载流程定义
  useEffect(() => {
    loadProcessDefinitions()
  }, [])

  // 流程图弹窗打开时渲染BPMN图（保留此effect作为后备）
  useEffect(() => {
    if (diagramModalVisible && bpmnXml) {
      // 使用setTimeout确保DOM已更新
      const timeoutId = setTimeout(() => {
        renderBpmnDiagram()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [diagramModalVisible, bpmnXml])

  // 组件卸载时销毁viewer
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="table-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>流程定义管理</h2>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={refreshProcessDefinitions}
          loading={loading}
        >
          刷新
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={processDefinitions}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: '暂无流程定义数据',
        }}
      />
      
      {selectedDefinition && (
        <div style={{ marginTop: 24 }}>
          <Divider />
          <Card title="流程定义详情" size="small">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p><strong>流程定义名称:</strong> {selectedDefinition.name}</p>
                <p><strong>流程定义ID:</strong> {selectedDefinition.id}</p>
                <p><strong>流程定义键:</strong> {selectedDefinition.key}</p>
                <p><strong>版本:</strong> {selectedDefinition.version}</p>
              </div>
              <div>
                <p><strong>部署时间:</strong> {new Date(selectedDefinition.deploymentTime).toLocaleString('zh-CN')}</p>
                <p><strong>资源名称:</strong> {selectedDefinition.resourceName}</p>
                <p><strong>状态:</strong> {selectedDefinition.suspend ? '已挂起' : '激活'}</p>
                <p><strong>租户ID:</strong> {selectedDefinition.tenantId || '无'}</p>
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Button
                icon={<FileTextOutlined />}
                onClick={viewProcessXml}
                loading={loading}
              >
                查看流程XML
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={viewProcessDiagram}
                loading={loading}
              >
                查看流程图
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* XML查看弹窗 */}
      <Modal
        title="流程定义XML"
        open={xmlModalVisible}
        onCancel={() => setXmlModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setXmlModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
        height={600}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: 16, height: 500, overflow: 'auto', backgroundColor: '#f5f5f5', fontFamily: 'monospace' }}
             onClick={(e) => e.stopPropagation()}>
          <pre>{bpmnXml}</pre>
        </div>
      </Modal>

      {/* 流程图查看弹窗 - 使用bpmn-js */}
      <Modal
        title="流程图"
        open={diagramModalVisible}
        onCancel={() => setDiagramModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDiagramModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
        height={600}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: 16, height: 500 }}
             onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              加载中...
            </div>
          ) : (
            <div 
              ref={diagramRef}
              style={{ width: '100%', height: '100%', border: '1px solid #ddd' }}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default LeaveProcessDefinition