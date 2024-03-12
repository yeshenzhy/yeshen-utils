import { Ref, ref } from "vue";

/** boolean组合式函数 */
export type UseBoolean = {
    bool: Ref<boolean>;
    setBool: (value: boolean) => void;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
};

/**
 * boolean组合式函数
 * @param initValue 初始值
 */
export function useBoolean(initValue = false): UseBoolean {
    const bool = ref(initValue);

    function setBool(value: boolean) {
        bool.value = value;
    }
    function setTrue() {
        setBool(true);
    }
    function setFalse() {
        setBool(false);
    }
    function toggle() {
        setBool(!bool.value);
    }

    return {
        bool,
        setBool,
        setTrue,
        setFalse,
        toggle,
    };
}
