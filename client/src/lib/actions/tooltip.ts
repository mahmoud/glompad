import tippy, {followCursor} from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
	
function tooltip(node, params) {
    if (params.disabled) {
        return;
    }
    const baseParams = {plugins: [followCursor]}
    let tip = tippy(node, {...baseParams, ...params});
    return {
        update: (newParams) => {
            tip.setProps({...baseParams, ...newParams});
        },
        destroy: () => {
            tip.destroy();
        }
    }
}

export default tooltip;