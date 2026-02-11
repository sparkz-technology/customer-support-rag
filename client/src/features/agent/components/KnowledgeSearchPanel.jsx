import { useState, useCallback } from 'react';
import { Input, Card, List, Typography, Tag, Empty, Spin, Collapse } from 'antd';
import { SearchOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons';
import { useKnowledgeSearch } from '../api/useKnowledgeSearch';

const { Text, Paragraph } = Typography;

/**
 * KnowledgeSearchPanel — collapsible knowledge base search for agents.
 * Queries the Pinecone hybrid search endpoint and shows results inline.
 */
export default function KnowledgeSearchPanel({ onInsertSnippet }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [timer, setTimer] = useState(null);

  const { data, isLoading, isFetching } = useKnowledgeSearch(debouncedQuery);

  const handleChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);
      if (timer) clearTimeout(timer);
      const t = setTimeout(() => setDebouncedQuery(value.trim()), 400);
      setTimer(t);
    },
    [timer],
  );

  const results = data?.results || [];

  return (
    <Collapse
      ghost
      size="small"
      items={[
        {
          key: 'kb',
          label: (
            <span style={{ fontSize: 12 }}>
              <BookOutlined /> Knowledge Base{' '}
              {isFetching && <Spin size="small" style={{ marginLeft: 4 }} />}
            </span>
          ),
          children: (
            <div style={{ maxHeight: 300, display: 'flex', flexDirection: 'column' }}>
              <Input
                size="small"
                placeholder="Search knowledge base..."
                prefix={<SearchOutlined />}
                value={query}
                onChange={handleChange}
                allowClear
                style={{ marginBottom: 8 }}
              />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading && (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <Spin size="small" />
                  </div>
                )}
                {!isLoading && debouncedQuery && results.length === 0 && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No results" style={{ margin: 8 }} />
                )}
                {results.length > 0 && (
                  <List
                    size="small"
                    dataSource={results}
                    renderItem={(item, idx) => (
                      <List.Item
                        key={idx}
                        style={{ padding: '6px 0', cursor: onInsertSnippet ? 'pointer' : 'default' }}
                        onClick={() => onInsertSnippet?.(item.content || item.pageContent || '')}
                      >
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <FileTextOutlined style={{ fontSize: 11, color: '#22c55e' }} />
                            {item.source && (
                              <Tag style={{ fontSize: 9, padding: '0 4px' }}>{item.source}</Tag>
                            )}
                            {item.score != null && (
                              <Text type="secondary" style={{ fontSize: 10, marginLeft: 'auto' }}>
                                {(item.score * 100).toFixed(0)}% match
                              </Text>
                            )}
                          </div>
                          <Paragraph
                            style={{ margin: 0, fontSize: 11, color: '#d4d4d4' }}
                            ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                          >
                            {item.content || item.pageContent || ''}
                          </Paragraph>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
