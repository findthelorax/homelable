import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import { MousePointer2, Hand } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { useCanvasStore } from '@/stores/canvasStore'
import { useThemeStore } from '@/stores/themeStore'
import { THEMES } from '@/utils/themes'
import { nodeTypes } from './nodes/nodeTypes'
import { edgeTypes } from './edges/edgeTypes'
import { SearchBar } from './SearchBar'
import type { NodeData, EdgeData } from '@/types'

interface CanvasContainerProps {
  onConnect?: (connection: Connection) => void
  onEdgeDoubleClick?: (edge: Edge<EdgeData>) => void
  onNodeDoubleClick?: (node: Node<NodeData>) => void
  onNodeDragStart?: () => void
  onOpenPending?: (deviceId: string) => void
}

export function CanvasContainer({ onConnect: onConnectProp, onEdgeDoubleClick, onNodeDoubleClick, onNodeDragStart, onOpenPending }: CanvasContainerProps) {
  const [lassoMode, setLassoMode] = useState(true)
  const {
    nodes, edges,
    onNodesChange, onEdgesChange,
    setSelectedNode, snapshotHistory,
    fitViewPending, clearFitViewPending,
  } = useCanvasStore()
  const { fitView, setCenter } = useReactFlow()

  // Fit view after canvas loads (fitViewPending is set by loadCanvas)
  useEffect(() => {
    if (!fitViewPending || nodes.length === 0) return
    const id = setTimeout(() => {
      fitView({ padding: 0.12, duration: 350 })
      clearFitViewPending()
    }, 50)
    return () => clearTimeout(id)
  }, [fitViewPending, nodes.length, fitView, clearFitViewPending])

  useEffect(() => {
    const handleFocusNode = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>
      const nodeId = customEvent.detail?.id
      if (!nodeId) return
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      let absX = node.position.x
      let absY = node.position.y
      if (node.parentId) {
        const parent = nodes.find((n) => n.id === node.parentId)
        if (parent) {
          absX += parent.position.x
          absY += parent.position.y
        }
      }

      const width = node.measured?.width ?? node.width ?? 200
      const height = node.measured?.height ?? node.height ?? 80
      setCenter(absX + width / 2, absY + height / 2, { zoom: 1.5, duration: 500 })
    }

    window.addEventListener('canvas:focus-node', handleFocusNode)
    return () => window.removeEventListener('canvas:focus-node', handleFocusNode)
  }, [nodes, setCenter])

  const activeTheme = useThemeStore((s) => s.activeTheme)
  const theme = THEMES[activeTheme]


  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const handleEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge<EdgeData>) => {
    onEdgeDoubleClick?.(edge)
  }, [onEdgeDoubleClick])

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    onNodeDoubleClick?.(node)
  }, [onNodeDoubleClick])

  const handleBeforeDelete = useCallback(async () => {
    snapshotHistory()
    return true
  }, [snapshotHistory])

  const isValidConnection = useCallback(
    (connection: { source: string | null; target: string | null }) => connection.source !== connection.target,
    []
  )

  return (
    <div className="w-full h-full" style={{ background: theme.colors.canvasBackground }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectProp}
        onPaneClick={onPaneClick}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeDragStart={onNodeDragStart}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        onBeforeDelete={handleBeforeDelete}
        selectionOnDrag={lassoMode}
        panOnDrag={lassoMode ? [1, 2] : true}
        panActivationKeyCode="Space"
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Meta', 'Control']}
        minZoom={0.25}
        maxZoom={2.5}
        snapToGrid
        snapGrid={[8, 8]}
        colorMode={theme.colors.reactFlowColorMode}
        elevateNodesOnSelect={false}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={theme.colors.canvasDotColor}
        />
        <SearchBar onOpenPending={onOpenPending} />
        <Controls>
          <ControlButton
            onClick={() => setLassoMode((m) => !m)}
            title={lassoMode ? 'Switch to pan mode (Space to pan)' : 'Switch to lasso mode'}
          >
            {lassoMode ? <MousePointer2 size={12} /> : <Hand size={12} />}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  )
}
