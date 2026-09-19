import {redirect} from 'next/navigation';

/**
 * `/profile` is the canonical signed-in workspace. Keep the legacy dashboard
 * URL as a compatibility redirect so old links cannot expose a second, stale
 * interpretation of DNA, context-completeness or Match state.
 */
export default function Dashboard(){
 redirect('/profile');
}
