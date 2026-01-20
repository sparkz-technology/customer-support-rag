/**
 * Agent Selection Utility Functions
 * 
 * Utility functions for filtering and sorting agents.
 * Separated from components to maintain fast-refresh compatibility.
 */

/**
 * Filters agents by capacity (currentLoad < maxLoad)
 * @param {Array} agents - List of agents
 * @returns {Array} Agents with available capacity
 */
export const filterAgentsByCapacity = (agents) => {
  if (!agents || !Array.isArray(agents)) return [];
  return agents.filter(agent => 
    agent.isActive !== false && 
    (agent.currentLoad || 0) < (agent.maxLoad || 10)
  );
};

/**
 * Sorts agents to prioritize those matching the ticket category
 * @param {Array} agents - List of agents
 * @param {string} ticketCategory - The ticket's category
 * @returns {Array} Sorted agents with matching category first
 */
export const sortAgentsByCategory = (agents, ticketCategory) => {
  if (!agents || !Array.isArray(agents)) return [];
  if (!ticketCategory) return agents;
  
  const normalizedCategory = ticketCategory.toLowerCase();
  
  return [...agents].sort((a, b) => {
    const aCategories = (a.categories || []).map(c => c.toLowerCase());
    const bCategories = (b.categories || []).map(c => c.toLowerCase());
    
    const aMatches = aCategories.includes(normalizedCategory);
    const bMatches = bCategories.includes(normalizedCategory);
    
    if (aMatches && !bMatches) return -1;
    if (!aMatches && bMatches) return 1;
    return 0;
  });
};

/**
 * Processes agents: filters by capacity and sorts by category match
 * @param {Array} agents - List of agents
 * @param {string} ticketCategory - The ticket's category
 * @returns {Array} Processed agents ready for display
 */
export const processAgentsForDropdown = (agents, ticketCategory) => {
  const filtered = filterAgentsByCapacity(agents);
  return sortAgentsByCategory(filtered, ticketCategory);
};
