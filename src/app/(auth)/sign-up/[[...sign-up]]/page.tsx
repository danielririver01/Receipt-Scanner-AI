import { redirect } from 'next/navigation';

const FLASK_REGISTER_URL = process.env.NEXT_PUBLIC_FLASK_REGISTER_URL || 'http://localhost:5000/register';

export default function SignUpPage() {
  redirect(FLASK_REGISTER_URL);
}