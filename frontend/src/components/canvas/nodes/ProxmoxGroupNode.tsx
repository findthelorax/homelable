import { createElement } from 'react'
import { Handle, Position, NodeResizer, type NodeProps, type Node } from '@xyflow/react'
import { Layers } from 'lucide-react'
import type { NodeData } from '@/types'
import { resolveNodeColors } from '@/utils/nodeColors'
import { resolveNodeIcon } from '@/utils/nodeIcons'
import { resolvePropertyIcon } from '@/utils/propertyIcons'
import { useCanvasStore } from '@/stores/canvasStore'
import { maskIp } from '@/utils/maskIp'
import { useThemeStore } from '@/stores/themeStore'
import { THEMES } from '@/utils/themes'
import { BaseNode } from './BaseNode'

export function ProxmoxGroupNode(props: NodeProps<Node<NodeData>>) {
  const { data, selected, width, height } = props

  const activeTheme = useThemeStore((s) => s.activeTheme)
  const hideIp = useCanvasStore((s) => s.hideIp)
  const theme = THEMES[activeTheme]
  const colors = resolveNodeColors(data, activeTheme)
  const isOnline = data.status === 'online'
  const statusColor = theme.colors.statusColors[data.status]

  const glow = colors.border
  const proxmoxAccent = theme.colors.nodeAccents.proxmox.border

  const resolvedIcon = resolveNodeIcon(Layers, data.custom_icon)
  const visibleProperties = data.properties?.filter((p) => p.visible) ?? []

  const showContainer = data.container_mode === true

  // Render as a regular node when container mode is disabled
  if (!showContainer) {
    return (
      <>
        <BaseNode {...props} icon={Layers} />
        <Handle
          type="source"
          position={Position.Left}
          id="cluster-left"
          title="Same cluster"
          style={{ background: proxmoxAccent, borderColor: `${proxmoxAccent}88`, width: 6, height: 6 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="cluster-right"
          title="Same cluster"
          style={{ background: proxmoxAccent, borderColor: `${proxmoxAccent}88`, width: 6, height: 6 }}
        />
      </>
    )
  }

  // CONTAINER MODE
  return (
    <div className="relative">

      {/* Group border */}
      <div
        className="w-full h-full rounded-xl border-2 flex flex-col overflow-hidden"
        style={{
          width: width ?? '100%',
          height: height ?? '100%',
          minWidth: 220,
          minHeight: 160,
          borderColor: selected ? glow : `${glow}88`,
          background: isOnline ? `${colors.background}cc` : `${colors.background}aa`,
          boxShadow: isOnline
            ? `0 0 20px ${glow}1a, inset 0 0 40px ${glow}08`
            : selected
            ? `0 0 12px ${glow}33`
            : 'none',
        }}
      >
      <NodeResizer
        minWidth={220}
        minHeight={160}
        isVisible={selected}
        lineStyle={{ borderColor: glow, opacity: 0.6 }}
        handleStyle={{ borderColor: glow, backgroundColor: theme.colors.nodeCardBackground, width: 6, height: 6 }}
      />

        {/* Header bar */}
        <div
          className="flex flex-row items-start gap-2 px-2.5 py-1.5 shrink-0"
          style={{
            background: isOnline ? `${glow}18` : `${theme.colors.nodeIconBackground}88`,
            borderBottom: `2px solid ${isOnline ? `${glow}33` : theme.colors.handleBackground}`,
          }}
        >
          <div
            className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
            style={{
              color: isOnline ? colors.icon : theme.colors.nodeSubtextColor,
              background: theme.colors.nodeIconBackground,
            }}
          >
            {createElement(resolvedIcon, { size: 15 })}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div
              className="text-[11px] font-semibold leading-tight truncate"
              style={{ color: isOnline ? glow : theme.colors.nodeLabelColor }}
              title={data.label}
            >
              {data.label}
            </div>

            {/* IP / HOST */}
            {(data.ip || data.hostname) && (
              <div className="flex flex-wrap gap-1 font-mono text-[9px] min-w-0">
                {data.ip && <a className="hover:underline cursor-pointer">{hideIp ? maskIp(data.ip) : data.ip}</a>}
                {data.hostname && <a className="hover:underline cursor-pointer">{data.hostname}</a>}
              </div>
            )}

            {/* PROPERTIES */}
            {visibleProperties.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 min-w-0">
                {visibleProperties.map((prop) => {
                  const Icon = resolvePropertyIcon(prop.icon)

                  return (
                    <span
                      key={prop.key}
                      className="flex items-center gap-1 font-mono text-[10px] min-w-0 max-w-full"
                      style={{ color: theme.colors.nodeSubtextColor }}
                    >
                      {Icon && <Icon size={9} className="shrink-0" />}
                      <span className="truncate max-w-30" title={prop.key}>
                        {prop.key}
                      </span>

                      <span className="truncate min-w-0" title={prop.value}>
                        · {prop.value}
                      </span>
                    </span>
                  )
                })}
              </div>
            )}
    </div>
          {/* Status dot */}
          <div
            className="ml-auto mt-1 w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
            title={data.status}
          />
        </div>

        {/* Inner area — React Flow places children here */}
        <div className="flex-1 relative" />
      </div>

      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: theme.colors.handleBackground, borderColor: theme.colors.handleBorder }}
      />
      <Handle type="target" position={Position.Top} id="top-t" style={{ opacity: 0, width: 12, height: 12 }} />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: theme.colors.handleBackground, borderColor: theme.colors.handleBorder }}
      />
      <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ opacity: 0, width: 12, height: 12 }} />

      {/* Cluster handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="cluster-left"
        title="Same cluster"
        style={{ background: proxmoxAccent, borderColor: `${proxmoxAccent}88`, width: 6, height: 6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="cluster-right"
        title="Same cluster"
        style={{ background: proxmoxAccent, borderColor: `${proxmoxAccent}88`, width: 6, height: 6 }}
      />
    </div>

  )
}
