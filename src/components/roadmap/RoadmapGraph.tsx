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
  const navigate = useNavigate();
  const location = useLocation();
  const topicsStore = useTopicStore((state) => state.topics);

  // Compute graph layout
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const groupSpacingY = 160;
  const startY = 60;
  const groupX = 140;
  const topicStartX = 340;
  const topicSpacingX = 160;

  CURRICULUM_GROUPS.forEach((group, gIndex) => {
    const gY = startY + gIndex * groupSpacingY;
    const groupId = `group-${group.id}`;

    // Add group hub node
    nodes.push({
      id: groupId,
      title: group.title,
      isGroup: true,
      x: groupX,
      y: gY,
    });

    // Add topic leaf nodes & connecting edges
    group.routes.forEach((route: CurriculumRoute, rIndex: number) => {
      const row = Math.floor(rIndex / 3);
      const col = rIndex % 3;
      const tX = topicStartX + col * topicSpacingX;
      const tY = gY - 25 + row * 50;

      const topicRecord = topicsStore[route.id];
      const status = topicRecord?.status || 'not_started';

      nodes.push({
        id: route.id,
        title: route.title,
        path: route.path,
        isGroup: false,
        status,
        x: tX,
        y: tY,
        parentId: groupId,
      });

      edges.push({
        id: `${groupId}->${route.id}`,
        from: { x: groupX, y: gY },
        to: { x: tX, y: tY },
      });
    });
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

  const width = 840;
  const height = startY + CURRICULUM_GROUPS.length * groupSpacingY + 40;

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
            const controlX1 = edge.from.x + dx * 0.5;
            const controlX2 = edge.from.x + dx * 0.5;
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
                    x="-100"
                    y="-18"
                    width="200"
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
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="var(--font-heading)"
                  >
                    {node.title}
                  </text>
                </g>
              );
            }

            const isSelected = location.pathname === node.path;
            const nodeColor = getStatusColor(node.status, isSelected);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => node.path && navigate(node.path)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer halo if active */}
                {isSelected && (
                  <circle
                    r="16"
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="2"
                    filter="url(#glow-active)"
                    opacity="0.8"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r="10"
                  fill="var(--color-bg-surface)"
                  stroke={nodeColor}
                  strokeWidth="2.5"
                />

                {/* Label */}
                <text
                  x="16"
                  y="4"
                  textAnchor="start"
                  fill={isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)'}
                  fontSize="11"
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
