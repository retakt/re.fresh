// Re-export the toast API from the toast provider
export { toast, useToast } from '@/components/providers/toast';

// For backward compatibility, also export as default
import { toast } from '@/components/providers/toast';
export default toast;