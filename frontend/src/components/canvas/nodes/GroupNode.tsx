import { useState } from 'react'
import { type NodeProps, type Node, NodeResizer } from '@xyflow/react'
import { Layers, Pencil, Check, X } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvasStore'
import { STATUS_COLORS, type NodeData } from '@/types'
import { useThemeStore } from '@/stores/themeStore'
import { resolveNodeColors } from '@/utils/nodeColors'

export function GroupNode({ id, data, selected, width, height }: NodeProps<Node<NodeData>>) {
  const { nodes, updateNode, snapshotHistory } = useCanvasStore()
  const showBorder = data.custom_colors?.show_border !== false
  const isVisible = showBorder || selected
  const showBackground = data.custom_colors?.show_background !== false

  const [editing, setEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState(data.label)

  const children = nodes.filter((n) => n.parentId === id)
  const onlineCount = children.filter((n) => n.data.status === 'online').length
  const offlineCount = children.filter((n) => n.data.status === 'offline').length
  const unknownCount = children.length - onlineCount - offlineCount

  const activeTheme = useThemeStore((s) => s.activeTheme)
  const colors = resolveNodeColors(data, activeTheme)
  const glow = colors.border

  const handleRename = () => {
    if (labelDraft.trim()) {
      snapshotHistory()
      updateNode(id, { label: labelDraft.trim() })
    }
    setEditing(false)
  }

  const borderColor = selected ? '#00d4ff' : '#30363d'
  const borderStyle = selected ? 'solid' : 'dashed'

  return (
    <div
      className="relative flex flex-col rounded-xl border-2 overflow-hidden"
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        minWidth: 200,
        minHeight: 100,
        position: 'relative',
        borderRadius: 8,
        border: isVisible ? `2px ${borderStyle} ${borderColor}` : '2px solid transparent',
        transition: 'border-color 0.15s, background 0.15s',
        boxSizing: 'border-box',
        borderColor: showBorder ? (selected ? glow : `${glow}33`) : 'transparent',
        background: showBackground ? (isVisible ? `${colors.background}cc` : `${colors.background}aa`) : 'transparent',
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        lineStyle={{ borderColor: 'transparent' }}
        handleStyle={{ borderColor: colors.border, background: colors.border, width: 16, height: 16 }}
      />

      {/* Header */}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: selected
              ? 'rgba(0,212,255,0.08)'
              : 'rgba(22,27,34,0.8)',
            borderRadius: '6px 6px 0 0',
            borderBottom: `1px solid ${borderColor}40`,
            boxSizing: 'border-box',
            minHeight: 32,
            pointerEvents: 'none',
          }}
        >
          <Layers size={12} style={{ color: '#00d4ff', flexShrink: 0 }} />

          {/* Label / input area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {editing ? (
              <input
                autoFocus
                className="nodrag"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename()
                  if (e.key === 'Escape') {
                    setLabelDraft(data.label)
                    setEditing(false)
                  }
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e6edf3',
                  fontSize: 11,
                  fontWeight: 600,
                  pointerEvents: 'auto',
                }}
              />
            ) : (
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#e6edf3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {data.label}
              </span>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
            {editing ? (
              <>
                <button className="nodrag" onClick={handleRename} style={{ color: '#39d353', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Check size={11} />
                </button>
                <button
                  className="nodrag"
                  onClick={() => {
                    setLabelDraft(data.label)
                    setEditing(false)
                  }}
                  style={{ color: '#f85149', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={11} />
                </button>
              </>
            ) : (
              <button
                className="nodrag"
                onClick={() => {
                  setLabelDraft(data.label)
                  setEditing(true)
                }}
                style={{
                  color: '#8b949e',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: selected ? 1 : 0,
                  pointerEvents: 'auto',
                }}
                title="Rename group"
              >
                <Pencil size={10} />
              </button>
            )}
          </div>

          {/* Status summary */}
          {children.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, flexShrink: 0, marginLeft: 4 }}>
              {onlineCount > 0 && <span style={{ color: STATUS_COLORS.online }}>● {onlineCount}</span>}
              {offlineCount > 0 && <span style={{ color: STATUS_COLORS.offline }}>● {offlineCount}</span>}
              {unknownCount > 0 && <span style={{ color: STATUS_COLORS.unknown }}>● {unknownCount}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
