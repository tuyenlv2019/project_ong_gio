import { ClockCircleOutlined, EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import './SiteFooter.css';

export const SITE_COPYRIGHT =
  'Copyright 2026 © CÔNG TY TNHH SX TM DV CƠ ĐIỆN THUẬN PHONG';

const SITE_PHONE = '0907 023 043';
const SITE_PHONE_HREF = 'tel:+84907023043';
const SITE_EMAIL = 'info@codienthuanphong.com.vn';

type SiteFooterProps = {
  variant?: 'login' | 'sidebar';
};

function ContactItem({
  icon,
  lines,
}: {
  icon: ReactNode;
  lines: ReactNode[];
}) {
  return (
    <div className="site-footer-item">
      <div className="site-footer-icon" aria-hidden>
        {icon}
      </div>
      <div className="site-footer-text">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default function SiteFooter({ variant = 'sidebar' }: SiteFooterProps) {
  return (
    <footer className={`site-footer site-footer--${variant}`}>
      <div className="site-footer-top">
        <p className="site-footer-copyright">{SITE_COPYRIGHT}</p>
      </div>
      <div className="site-footer-contact">
        <ContactItem
          icon={<EnvironmentOutlined />}
          lines={[
            '223 Trường Chinh, Phường An Khê',
            'TP. Đà Nẵng, Việt Nam',
          ]}
        />
        <ContactItem
          icon={<ClockCircleOutlined />}
          lines={['07:45 - 17:00', 'Hỗ trợ 24/7']}
        />
        <ContactItem
          icon={<PhoneOutlined />}
          lines={[
            <a key="phone" href={SITE_PHONE_HREF}>{SITE_PHONE}</a>,
            <a key="email" href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>,
          ]}
        />
      </div>
    </footer>
  );
}
