import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import memoize from 'memoizee';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGripper } from '@deephaven/icons';
import { RangeUtils } from '@deephaven/utils';
import ItemList from './ItemList';
import { Tooltip } from './popper';
import './DraggableItemList.scss';

/**
 * Show a draggable item list. It _must_ be used within a `DragDropContext`.
 * This implementation uses react-beautiful-dnd for handling dragging and dropping of items.
 * We use ItemList to handle selection for multi drag and drop (not built in to react-beautiful-dnd).
 * One caveat with the use of react-beautiful-dnd is that it doesn't allow a drag to be initiated while
 * using a modifier key: https://github.com/atlassian/react-beautiful-dnd/issues/1678
 */
class DraggableItemList extends PureComponent {
  static DEFAULT_ROW_HEIGHT = 30;

  static renderHandle() {
    return (
      <div>
        <Tooltip>Drag to re-order</Tooltip>
        <FontAwesomeIcon icon={vsGripper} />
      </div>
    );
  }

  static renderBadge({ text }) {
    return text ? <span className="number-badge">{text}</span> : null;
  }

  static renderTextItem({ text, badgeText = '', className = '' }) {
    return (
      <div
        className={classNames(
          'item-list-item-content',
          'draggable-item-list-item-content',
          className
        )}
      >
        <span className="title">{text}</span>
        {DraggableItemList.renderBadge({ text: badgeText })}
        {DraggableItemList.renderHandle()}
      </div>
    );
  }

  static renderItem({ item, isClone, selectedCount }) {
    const text = item && (item.displayValue || item.value || item);
    const badgeText = isClone ? `${selectedCount}` : null;
    const className = isClone ? 'item-list-item-clone' : '';
    return DraggableItemList.renderTextItem({ text, badgeText, className });
  }

  static getDraggableId(draggablePrefix, itemIndex) {
    return `${draggablePrefix}/${itemIndex}`;
  }

  static getDraggableIndex(draggableId) {
    return parseInt(draggableId.split('/').pop(), 10);
  }

  constructor(props) {
    super(props);

    this.handleSelectionChange = this.handleSelectionChange.bind(this);

    this.itemList = React.createRef();

    this.state = {
      selectedCount: 0,
    };
  }

  focusItem(itemIndex) {
    if (this.itemList.current) {
      this.itemList.current.focusItem(itemIndex);
    }
  }

  scrollToItem(itemIndex) {
    if (this.itemList.current) {
      this.itemList.current.scrollToItem(itemIndex);
    }
  }

  getCachedDraggableItem = memoize(
    (
      draggablePrefix,
      renderItem,
      item,
      itemIndex,
      isKeyboardSelected,
      isSelected,
      isDragDisabled,
      style
    ) => (
      <Draggable
        key={itemIndex}
        draggableId={DraggableItemList.getDraggableId(
          draggablePrefix,
          itemIndex
        )}
        index={itemIndex}
        isDragDisabled={isDragDisabled}
      >
        {provided => (
          <div
            role="menuitem"
            className="draggable-item-list-item"
            ref={provided.innerRef}
            tabIndex={-1}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.draggableProps}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.dragHandleProps}
          >
            {renderItem({
              item,
              itemIndex,
              isKeyboardSelected,
              isSelected,
              style,
              isClone: false,
            })}
          </div>
        )}
      </Draggable>
    ),
    { max: ItemList.CACHE_SIZE }
  );

  handleSelectionChange(selectedRanges) {
    this.setState({ selectedCount: RangeUtils.count(selectedRanges) });

    const { onSelectionChange } = this.props;
    onSelectionChange(selectedRanges);
  }

  getCachedRenderDraggableItem = memoize(
    (draggablePrefix, isDragDisabled, renderItem) => ({
      item,
      itemIndex,
      isKeyboardSelected,
      isSelected,
      style,
    }) =>
      this.getCachedDraggableItem(
        draggablePrefix,
        renderItem,
        item,
        itemIndex,
        isKeyboardSelected,
        isSelected,
        isDragDisabled,
        style
      ),
    { max: 1 }
  );

  getCachedRenderClone = memoize(
    (draggingItemClassName, items, offset, renderItem) => (
      provided,
      snapshot,
      rubric
    ) => {
      const { selectedCount } = this.state;
      const { index: itemIndex } = rubric.source;
      const item = items[itemIndex - offset];
      return (
        <div
          className={classNames(
            'draggable-item-list-dragging-item-container',
            draggingItemClassName
          )}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...provided.draggableProps}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...provided.dragHandleProps}
          ref={provided.innerRef}
        >
          <div
            className={classNames(
              'draggable-item-list-dragging-item',
              { 'two-dragged': selectedCount === 2 },
              { 'multiple-dragged': selectedCount > 2 }
            )}
          >
            {renderItem({
              item,
              itemIndex,
              isKeyboardSelected: false,
              isSelected: true,
              style: {},
              isClone: true,
              selectedCount,
            })}
          </div>
        </div>
      );
    },
    { max: 1 }
  );

  render() {
    const {
      className,
      draggablePrefix,
      draggingItemClassName,
      droppableId,
      isDragDisabled,
      isDropDisabled,
      isMultiSelect,
      isStickyBottom,
      itemCount,
      items,
      onViewportChange,
      offset,
      renderItem,
      rowHeight,
      selectedRanges,
      onSelect,
      style,
    } = this.props;
    return (
      <Droppable
        isDropDisabled={isDropDisabled}
        droppableId={droppableId}
        mode="virtual"
        renderClone={this.getCachedRenderClone(
          draggingItemClassName,
          items,
          offset,
          renderItem
        )}
      >
        {(provided, snapshot) => (
          <div
            role="menu"
            className={classNames('draggable-item-list', className, {
              'is-drop-disabled': isDropDisabled,
              'is-drag-disabled': isDragDisabled,
              'is-dragging-from-this': snapshot.draggingFromThisWith,
              'is-dragging-over': snapshot.isDraggingOver,
              'is-dropping': snapshot.draggingOverWith,
            })}
            style={style}
            ref={provided.innerRef}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.droppableProps}
          >
            <ItemList
              focusSelector=".draggable-item-list-item"
              isDragSelect={false}
              isMultiSelect={isMultiSelect}
              isStickyBottom={isStickyBottom}
              itemCount={itemCount}
              items={items}
              onSelect={onSelect}
              onSelectionChange={this.handleSelectionChange}
              onViewportChange={onViewportChange}
              offset={offset}
              ref={this.itemList}
              renderItem={this.getCachedRenderDraggableItem(
                draggablePrefix,
                isDragDisabled,
                renderItem
              )}
              rowHeight={rowHeight}
              selectedRanges={selectedRanges}
            />
          </div>
        )}
      </Droppable>
    );
  }
}

DraggableItemList.propTypes = {
  className: PropTypes.string,
  draggingItemClassName: PropTypes.string,

  // Total item count
  itemCount: PropTypes.number.isRequired,
  rowHeight: PropTypes.number,

  // Offset of the top item in the items array
  offset: PropTypes.number,
  // Item object format expected by the default renderItem function
  // Can be anything as long as it's supported by the renderItem
  items: PropTypes.arrayOf(PropTypes.any),

  // Whether to allow dropping items in this list
  isDropDisabled: PropTypes.bool,

  // Whether to allow dragging items from this list
  isDragDisabled: PropTypes.bool,

  // Whether to allow multiple selections in this item list
  isMultiSelect: PropTypes.bool,

  // Set to true if you want the list to scroll when new items are added and it's already at the bottom
  isStickyBottom: PropTypes.bool,

  // Fired when an item is clicked. With multiple selection, fired on double click.
  onSelect: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onViewportChange: PropTypes.func,

  selectedRanges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),

  disableSelect: PropTypes.bool,

  renderItem: PropTypes.func,

  style: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})]),

  // The prefix to add to all draggable item IDs
  draggablePrefix: PropTypes.string,

  // The ID to give the droppable list
  droppableId: PropTypes.string,
};

DraggableItemList.defaultProps = {
  className: '',
  draggingItemClassName: '',

  offset: 0,
  items: [],
  rowHeight: DraggableItemList.DEFAULT_ROW_HEIGHT,

  isDropDisabled: false,

  isDragDisabled: false,

  isMultiSelect: false,

  isStickyBottom: false,

  disableSelect: false,

  style: null,

  onSelect: () => {},
  onSelectionChange: () => {},
  onViewportChange: () => {},
  renderItem: DraggableItemList.renderItem,
  selectedRanges: [],

  draggablePrefix: 'draggable-item',
  droppableId: 'droppable-item-list',
};

export default DraggableItemList;