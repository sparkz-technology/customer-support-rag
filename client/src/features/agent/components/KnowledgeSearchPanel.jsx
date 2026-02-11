import { useState, useCallback } from 'react';
import { Input, Card, List, Typography, Tag, Empty, Spin, Collapse, Button, Tooltip } from 'antd';
import { SearchOutlined, BookOutlined, FileTextOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { useKnowledgeSearch } from '../api/useKnowledgeSearch';
import toast from 'react-hot-toast';

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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

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
            <div style={{ maxHeight: 320, display: 'flex', flexDirection: 'column' }}>
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
                    renderItem={(item, idx) => {
                      const content = item.content || item.pageContent || '';
                      return (
                        <List.Item
                          key={idx}
                          style={{ padding: '6px 0' }}
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
                              <Tooltip title="Copy to clipboard">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => handleCopy(content)}
                                  style={{ height: 18, width: 18, minWidth: 18, padding: 0, fontSize: 10 }}
                                />
                              </Tooltip>
                              {onInsertSnippet && (
                                <Tooltip title="Insert into reply">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<PlusOutlined />}
                                    onClick={() => onInsertSnippet(content)}
                                    style={{ height: 18, width: 18, minWidth: 18, padding: 0, fontSize: 10 }}
                                  />
                                </Tooltip>
                              )}
                            </div>
                            <Paragraph
                              style={{ margin: 0, fontSize: 11, color: '#d4d4d4' }}
                              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                            >
                              {content}
                            </Paragraph>
                          </div>
                        </List.Item>
                      );
                    }}
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
