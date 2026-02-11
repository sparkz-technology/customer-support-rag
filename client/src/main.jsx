import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './shared/components/ErrorBoundary.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

// Dark theme with green accent
const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#22c55e',
    colorSuccess: '#22c55e',
    colorInfo: '#22c55e',
    colorLink: '#22c55e',
    colorBgContainer: '#1a1a1a',
    colorBgElevated: '#1f1f1f',
    colorBgLayout: '#0f0f0f',
    colorBgSpotlight: '#262626',
    colorBgTextHover: '#262626',
    colorBgTextActive: '#303030',
    colorBorder: '#303030',
    colorBorderSecondary: '#262626',
    colorText: '#e5e5e5',
    colorTextSecondary: '#a3a3a3',
    colorTextTertiary: '#737373',
    colorFill: '#262626',
    colorFillSecondary: '#262626',
    colorFillTertiary: '#1f1f1f',
    colorFillQuaternary: '#1a1a1a',
    controlItemBgHover: '#262626',
    controlItemBgActive: '#22c55e20',
    controlItemBgActiveHover: '#22c55e30',
    borderRadius: 6,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    controlHeight: 32,
  },
  components: {
    Button: { 
      controlHeight: 32, 
      controlHeightSM: 24, 
      paddingContentHorizontal: 12,
      defaultBg: '#262626',
      defaultHoverBg: '#303030',
      defaultActiveBg: '#404040',
    },
    Card: { 
      paddingLG: 16, 
      padding: 12, 
      colorBgContainer: '#1a1a1a',
    },
    Table: { 
      cellPaddingBlock: 8, 
      cellPaddingInline: 12, 
      headerBg: '#1a1a1a',
      headerSortActiveBg: '#262626',
      headerSortHoverBg: '#262626',
      rowHoverBg: '#262626',
      rowSelectedBg: '#22c55e20',
      rowSelectedHoverBg: '#22c55e30',
      colorBgContainer: '#1a1a1a',
      bodySortBg: '#1f1f1f',
      headerFilterHoverBg: '#262626',
      filterDropdownBg: '#1f1f1f',
      fixedHeaderSortActiveBg: '#262626',
    },
    Menu: { 
      itemHeight: 36, 
      itemPaddingInline: 12, 
      iconSize: 14,
      darkItemBg: 'transparent',
      darkSubMenuItemBg: '#1a1a1a',
      darkItemHoverBg: '#262626',
      darkItemSelectedBg: '#22c55e20',
      darkItemColor: '#a3a3a3',
      darkItemHoverColor: '#e5e5e5',
      darkItemSelectedColor: '#22c55e',
      itemHoverBg: '#262626',
      itemSelectedBg: '#22c55e20',
      itemActiveBg: '#22c55e30',
      subMenuItemBg: '#1a1a1a',
      popupBg: '#1f1f1f',
    },
    Input: { 
      controlHeight: 32, 
      paddingInline: 10, 
      colorBgContainer: '#1a1a1a',
      hoverBorderColor: '#22c55e',
      activeBorderColor: '#22c55e',
      hoverBg: '#1a1a1a',
      activeBg: '#1a1a1a',
    },
    Select: { 
      controlHeight: 32, 
      colorBgContainer: '#1a1a1a',
      colorBgElevated: '#1f1f1f',
      optionSelectedBg: '#22c55e20',
      optionActiveBg: '#262626',
      selectorBg: '#1a1a1a',
    },
    Statistic: { contentFontSize: 20, titleFontSize: 12 },
    Form: { itemMarginBottom: 16 },
    Modal: { 
      paddingContentHorizontalLG: 20, 
      paddingMD: 16, 
      contentBg: '#1a1a1a', 
      headerBg: '#1a1a1a',
    },
    List: { 
      itemPadding: '8px 0',
      colorBgContainer: '#1a1a1a',
    },
    Dropdown: { 
      colorBgElevated: '#1f1f1f',
      controlItemBgHover: '#262626',
      controlItemBgActive: '#22c55e20',
    },
    Popover: { colorBgElevated: '#1f1f1f' },
    DatePicker: { 
      colorBgContainer: '#1a1a1a', 
      colorBgElevated: '#1f1f1f',
      cellHoverBg: '#262626',
      cellActiveWithRangeBg: '#22c55e20',
    },
    Collapse: { 
      colorBgContainer: '#1a1a1a', 
      headerBg: '#1a1a1a',
      contentBg: '#1a1a1a',
    },
    Tag: { defaultBg: '#262626' },
    Alert: { 
      colorInfoBg: '#1a1a1a', 
      colorSuccessBg: '#1a1a1a', 
      colorWarningBg: '#1a1a1a', 
      colorErrorBg: '#1a1a1a',
    },
    Progress: { remainingColor: '#262626' },
    Pagination: {
      itemBg: '#1a1a1a',
      itemActiveBg: '#22c55e',
      itemInputBg: '#1a1a1a',
    },
    Switch: {
      colorPrimaryHover: '#16a34a',
    },
    Tooltip: {
      colorBgSpotlight: '#262626',
    },
    Steps: {
      colorFillContent: '#262626',
    },
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={darkTheme}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#1f1f1f', color: '#e5e5e5', border: '1px solid #303030', fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1f1f1f' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1f1f1f' } },
          }}
        />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
);
