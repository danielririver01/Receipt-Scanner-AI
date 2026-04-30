import { redirect } from 'next/navigation';

export default function SignUpRedirect() {
  redirect('https://www.velzia.co/register?plan=trial');
}
