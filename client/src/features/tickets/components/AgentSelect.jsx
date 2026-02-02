import { Select, Tag, Space, Spin, Typography } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { agentApi } from '../../../api/client';

const { Text } = Typography;

import { processAgentsForDropdown } from '../utils/agentSelectUtils';

/**
 * Agent Select Component
 * Dropdown for selecting an agent for ticket assignment/reassignment
 * 
 * @param {string} currentAgentId - Currently assigned agent ID
 * @param {string} ticketCategory - Ticket category for prioritizing matching agents
 * @param {function} onSelect - Callback when agent is selected
 * @param {boolean} showCapacity - Whether to show agent capacity info
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} placeholder - Placeholder text
 */
export const AgentSelect = ({ 
  currentAgentId, 
  ticketCategory,
  onSelect,
  showCapacity = true,
  disabled = false,
  placeholder = 'Select an agent'
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: agentApi.getAgents,
    staleTime: 30000,
  });

  const agents = data?.agents || [];
  const processedAgents = processAgentsForDropdown(agents, ticketCategory);

  const renderAgentOption = (agent) => {
    const isCurrentAgent = agent._id === currentAgentId || agent.id === currentAgentId;
    const categories = agent.categories || [];
    const matchesCategory = ticketCategory && 
      categories.map(c => c.toLowerCase()).includes(ticketCategory.toLowerCase());
    
    return (
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Space>
          <UserOutlined />
          <Text strong={matchesCategory}>
            {agent.name || agent.email}
          </Text>
          {isCurrentAgent && <Tag color="blue" style={{ fontSize: 10 }}>Current</Tag>}
          {matchesCategory && <Tag color="green" style={{ fontSize: 10 }}>Category Match</Tag>}
        </Space>
        {showCapacity && (
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Load: {agent.currentLoad || 0}/{agent.maxLoad || 10}
            </Text>
            {categories.length > 0 && (
              <>
                <Text type="secondary" style={{ fontSize: 11 }}>•</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <TeamOutlined /> {categories.join(', ')}
                </Text>
              </>
            )}
          </Space>
        )}
      </Space>
    );
  };

  if (error) {
    return (
      <Select
        disabled
        placeholder="Failed to load agents"
        style={{ width: '100%' }}
      />
    );
  }

  return (
    <Select
      value={currentAgentId}
      onChange={onSelect}
      disabled={disabled || isLoading}
      placeholder={placeholder}
      loading={isLoading}
      style={{ width: '100%' }}
      optionLabelProp="label"
      notFoundContent={isLoading ? <Spin size="small" /> : 'No available agents'}
    >
      {processedAgents.map(agent => (
        <Select.Option 
          key={agent._id || agent.id} 
          value={agent._id || agent.id}
          label={agent.name || agent.email}
        >
          {renderAgentOption(agent)}
        </Select.Option>
      ))}
    </Select>
  );
};

export default AgentSelect;
