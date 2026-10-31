import {
  BankOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';

export const BILLING_PAGES = [
  {
    path: '/billing-run',
    label: 'Billing Run',
    icon: <PlayCircleOutlined />,
    roles: ['admin'],
    block: 2,
    blurb: 'Preview, run, run twice and race two runs: always zero duplicate invoices.',
  },
  {
    path: '/invoices',
    label: 'Invoices',
    icon: <FileTextOutlined />,
    roles: ['admin', 'staff', 'customer'],
    block: 3,
    blurb: 'Confirm, cancel, send and print. Customers see only their own invoices.',
  },
  {
    path: '/payments',
    label: 'Payments',
    icon: <WalletOutlined />,
    roles: ['admin', 'staff'],
    block: 3,
    blurb: 'Every payment with method, amount, date and note, against the right invoice.',
  },
  {
    path: '/outstanding',
    label: 'Outstanding',
    icon: <WarningOutlined />,
    roles: ['admin', 'staff'],
    block: 3,
    blurb: 'What is still owed, what is overdue, and how old it is.',
  },
  {
    path: '/time-machine',
    label: 'Time Machine',
    icon: <ClockCircleOutlined />,
    roles: ['admin'],
    block: 4,
    blurb: 'Jump the date and watch renewals, billing, discount expiry and reminders happen on their own.',
  },
  {
    path: '/proof',
    label: 'Proof',
    icon: <SafetyCertificateOutlined />,
    roles: ['admin', 'staff'],
    block: 4,
    blurb: 'Seven live checks that the books are right, and the measured speed of every page.',
  },
  {
    path: '/bank-match',
    label: 'Bank Match',
    icon: <BankOutlined />,
    roles: ['admin', 'staff'],
    block: 5,
    blurb: 'Upload the bank statement; invoices match by number, amount and payer name.',
  },
];

export const pagesForRole = (role) => BILLING_PAGES.filter((p) => p.roles.includes(role));
