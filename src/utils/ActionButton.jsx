import React from 'react';
import { FaEllipsisH } from 'react-icons/fa';
import { Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { definePermission } from '../services/serviceFunction';

/**
 * ActionButton Component
 * 
 * A reusable template for action buttons in lists.
 * Shows up to 3 buttons as icons and groups the rest into a "more" dropdown.
 * 
 * @param {Array} actions - Array of action objects
 *   Each action: {
 *     type: 'view' | 'modify' | 'drop' | 'execute',
 *     icon: ReactNode,
 *     onClick: Function,
 *     title: String,
 *     className: String,
 *     label: String (text for dropdown items),
 *     disabled: Boolean
 *   }
 */
const ActionButton = ({ actions = [], menuId=0 }) => {
    const { t } = useTranslation();

    // Map types to Tailwind classes for consistent styling
    const getStyles = (type) => {
        switch (type) {
            case 'view':
                return 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30';
            case 'modify':
                return 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30';
            case 'drop':
                return 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30';
            case 'execute':
                return 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30';
            default:
                return 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700';
        }
    };

    const menuType = {
        modify: "is_modify",
        view: "is_view",
        drop: "is_drop",
        execute: "is_execute",
    }
    const visibleActions = actions.slice(0, 3);
    const extraActions = actions.slice(3);

    // Prepare items for antd Dropdown menu
    const dropdownItems = extraActions.map((action, index) => ({
        key: index,
        label: action.label || action.title || t(action.type || 'action'),
        icon: action.icon,
        onClick: action.onClick,
        disabled: action.disabled || !definePermission(menuId)[menuType[action.type]],
        danger: action.type === 'drop',
    }));

    

    return (
        <div className="flex items-center space-x-1.5">
            {visibleActions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled || !definePermission(menuId)[menuType[action.type]]}
                    className={`
                        transition-all duration-200 p-1.5 rounded-md flex items-center justify-center 
                        hover:scale-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none
                        ${getStyles(action.type)} 
                        ${action.className || ''}
                    `}
                    title={action.title || t(action.type || 'action')}
                >
                    {action.icon}
                </button>
            ))}
            
            {extraActions.length > 0 && (
                <Dropdown 
                    menu={{ items: dropdownItems }} 
                    trigger={['click']} 
                    placement="bottomRight"
                >
                    <button 
                        className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-md transition-all duration-200 hover:scale-110 active:scale-95" 
                        title={t('more')}
                    >
                        <FaEllipsisH className="w-4 h-4" />
                    </button>
                </Dropdown>
            )}
        </div>
    );
};

export default ActionButton;
