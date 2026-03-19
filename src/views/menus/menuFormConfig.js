export const INITIAL_MENU_FORM = {
  menu_name: '',
  menu_type: '',
  menu_icon: null,
  menu_path: '',
  order_menu: 0,
  parent_menu: '',
};

export const MENU_TYPE_OPTIONS = [
  { value: '1', label: 'SideBar Navigation' },
  { value: '2', label: 'Home Dashboard' },
  { value: '3', label: 'System Settings' },
  { value: '4', label: 'Analytical Reports' },
  { value: '5', label: 'Inventory' },
  { value: '6', label: 'FooterBar Navigation' },
];

export const MENU_TYPE_LABELS = {
  1: 'Sidebar',
  2: 'Home',
  3: 'Setting',
  4: 'Report',
  5: 'Inventory',
  6: 'Footer',
};

const DEFAULT_PARENT_BY_TYPE = {
  2: 5,
  3: 8,
  4: 18,
  5: 46,
};

export const getParentMenuId = (menuType, currentParent = '') => {
  const normalizedParent =
    currentParent === null || currentParent === undefined || currentParent === ''
      ? ''
      : Number(currentParent);

  return DEFAULT_PARENT_BY_TYPE[Number(menuType)] ?? normalizedParent;
};
