import { useNavigate, useLocation } from 'react-router-dom';
import { CURRICULUM_GROUPS, CurriculumRoute } from '../../data/curriculum';
import { useTopicStore } from '../../store/useTopicStore';
import { TopicStatus } from '../../types/storage';

interface NodePosition {
  x: number;
  y: number;
}

interface GraphNode {
  id: string;
  title: string;
  path?: string;
  isGroup: boolean;
  status?: TopicStatus;
  x: number;
  y: number;
  parentId?: string;
}

interface GraphEdge {
  from: NodePosition;
  to: NodePosition;
  id: string;
}

export default function RoadmapGraph() {
  let navigateFn: ((path: string) => void) | null = null;
  let currentPath = '';

  try {
    navigateFn = useNavigate();
  } catch {
    // router context guard
  }

  try {
    const loc = useLocation();
    if (loc) currentPath = loc.pathname;
  } catch {
    // router context guard
  }

  const topicsStore = useTopicStore((state) => state.topics);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const groupX = 140;
  const topicX = 380;
  const itemHeight = 38;
  const groupGap = 40;

  let currentY = 50;

  CURRICULUM_GROUPS.forEach((group) => {
    const groupId = `group-${group.id}`;
    const firstTopicY = currentY;

    // Add topic leaf nodes for this group
    group.routes.forEach((route: CurriculumRoute) => {
      const topicRecord = topicsStore[route.id];
      const status = topicRecord?.status || 'not_started';
      const tY = currentY;

      nodes.push({
        id: route.id,
        title: route.title,
        path: route.path,
        isGroup: false,
        status,
        x: topicX,
        y: tY,
        parentId: groupId,
      });

      currentY += itemHeight;
    });

    const lastTopicY = currentY - itemHeight;
    const groupCenterY = Math.round((firstTopicY + lastTopicY) / 2);

    // Add group hub node
    nodes.push({
      id: groupId,
      title: group.title,
      isGroup: true,
      x: groupX,
      y: groupCenterY,
    });

    // Add connecting edges from group hub right-edge to each topic node
    group.routes.forEach((route: CurriculumRoute) => {
      const topicNode = nodes.find((n) => n.id === route.id);
      if (topicNode) {
        edges.push({
          id: `${groupId}->${route.id}`,
          from: { x: groupX + 90, y: groupCenterY },
          to: { x: topicX, y: topicNode.y },
        });
      }
    });

    currentY += groupGap;
  });

  const getStatusColor = (status?: TopicStatus, isSelected?: boolean) => {
    if (isSelected) return 'var(--color-accent-primary)';
    switch (status) {
      case 'mastered':
        return 'var(--color-status-healthy)';
      case 'comfortable':
        return 'var(--color-status-warning)';
      case 'learning':
        return '#3b82f6';
      default:
        return '#4b5563'; // not_started
    }
  };

  const width = 760;
  const height = currentY;

  const handleNodeClick = (path?: string) => {
    if (!path) return;
    if (navigateFn) {
      navigateFn(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: 'var(--color-bg-base)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
        padding: 'var(--space-md)',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', margin: '0 auto', fontFamily: 'var(--font-body)' }}
      >
        {/* Glow Filters */}
        <defs>
          <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Edges */}
        <g className="graph-edges">
          {edges.map((edge) => {
            const dx = edge.to.x - edge.from.x;
            const controlX1 = edge.from.x + dx * 0.4;
            const controlX2 = edge.from.x + dx * 0.6;
            const d = `M ${edge.from.x} ${edge.from.y} C ${controlX1} ${edge.from.y}, ${controlX2} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`;

            return (
              <path
                key={edge.id}
                d={d}
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="graph-nodes">
          {nodes.map((node) => {
            if (node.isGroup) {
              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    x="-90"
                    y="-18"
                    width="180"
                    height="36"
                    rx="6"
                    fill="var(--color-bg-surface)"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="var(--color-text-primary)"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-heading)"
                  >
                    {node.title}
                  </text>
                </g>
              );
            }

            const isSelected = currentPath === node.path;
            const nodeColor = getStatusColor(node.status, isSelected);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node.path)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer halo if active */}
                {isSelected && (
                  <circle
                    r="14"
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="2"
                    filter="url(#glow-active)"
                    opacity="0.8"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r="8"
                  fill="var(--color-bg-surface)"
                  stroke={nodeColor}
                  strokeWidth="2.5"
                />

                {/* Label */}
                <text
                  x="16"
                  y="4"
                  textAnchor="start"
                  fill={isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-primary)'}
                  fontSize="12"
                  fontWeight={isSelected ? '600' : '400'}
                  fontFamily="var(--font-body)"
                >
                  {node.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
