import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Space, Steps, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const sendOtpMutation = useMutation({
    mutationFn: () => authApi.sendOtp(email),
    onSuccess: () => {
      setStep(1);
      toast.success('OTP sent to your email');
    },
    onError: (err) => toast.error(err.message),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => authApi.verifyOtp(email, otp),
    onSuccess: (data) => {
      login(data.sessionToken, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'agent') {
        navigate('/agent');
      } else {
        navigate('/');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (step === 0) {
      sendOtpMutation.mutate();
    } else {
      verifyOtpMutation.mutate();
    }
  };

  const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #262626 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          borderRadius: 16,
          background: '#1a1a1a',
          border: '1px solid #303030',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>S</span>
          </div>
          <Title level={3} style={{ margin: 0 }}>Support Portal</Title>
          <Text type="secondary">AI-powered customer support</Text>
        </div>

        {/* Steps */}
        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 32 }}
          items={[
            { title: 'Email' },
            { title: 'Verify' },
          ]}
        />

        {/* Form */}
        <Space.Compact style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 0 ? (
            <>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Email Address</Text>
                <Input
                  size="large"
                  prefix={<MailOutlined style={{ color: '#737373' }} />}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPressEnter={handleSubmit}
                />
              </div>
              <Button
                type="primary"
                size="large"
                block
                loading={isLoading}
                onClick={handleSubmit}
                style={{ height: 48 }}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Alert
                description={`Verification code sent to ${email}`}
                type="success"
                showIcon
                style={{ marginBottom: 8 }}
              />
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Enter OTP</Text>
                <Input.OTP
                  size="large"
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  style={{ width: '100%' }}
                />
              </div>
              <Button
                type="primary"
                size="large"
                block
                loading={isLoading}
                onClick={handleSubmit}
                style={{ height: 48 }}
              >
                Verify & Login
              </Button>
              <Button
                type="text"
                block
                icon={<ArrowLeftOutlined />}
                onClick={() => { setStep(0); setOtp(''); }}
              >
                Use different email
              </Button>
            </>
          )}
        </Space.Compact>

        {/* Dev hint */}
        <div style={{ 
          marginTop: 32, 
          padding: 16, 
          background: '#262626', 
          borderRadius: 8,
          textAlign: 'center',
          border: '1px solid #303030',
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Dev mode: Use OTP <Text code>123456</Text>
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            Try: <Text code>admin@example.com</Text> (Admin) • <Text code>john@support.com</Text> (Agent)
          </Text>
        </div>
      </Card>
    </div>
  );
}
