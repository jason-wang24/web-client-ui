import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelManager } from '@deephaven/dashboard';
import GoldenLayout from '@deephaven/golden-layout';
import LinkerOverlayContent from './LinkerOverlayContent';

const LINKER_OVERLAY_MESSAGE = 'TEST_MESSAGE';

function makeLayout() {
  return new GoldenLayout({});
}

function makePanelManager(layout = makeLayout()) {
  return new PanelManager(layout);
}

function mountOverlay({
  links = [],
  messageText = LINKER_OVERLAY_MESSAGE,
  onLinkDeleted = jest.fn(),
  onAllLinksDeleted = jest.fn(),
  onCancel = jest.fn(),
  onDone = jest.fn(),
  panelManager = makePanelManager(),
} = {}) {
  return render(
    <LinkerOverlayContent
      links={links}
      messageText={messageText}
      onLinkDeleted={onLinkDeleted}
      onAllLinksDeleted={onAllLinksDeleted}
      onCancel={onCancel}
      onDone={onDone}
      panelManager={panelManager}
    />
  );
}

it('calls appropriate functions on button and key presses', async () => {
  const onLinkDeleted = jest.fn();
  const onAllLinksDeleted = jest.fn();
  const onCancel = jest.fn();
  const onDone = jest.fn();
  mountOverlay({ onLinkDeleted, onAllLinksDeleted, onCancel, onDone });

  const dialog = screen.getByTestId('linker-toast-dialog');
  expect(dialog).toHaveTextContent(LINKER_OVERLAY_MESSAGE);
  const buttons = await screen.findAllByRole('button');
  expect(buttons).toHaveLength(3);

  const clearAllButton = screen.getByRole('button', { name: 'Clear All' });
  fireEvent.click(clearAllButton);
  expect(onAllLinksDeleted).toHaveBeenCalled();

  const doneButton = screen.getByRole('button', { name: 'Done' });
  fireEvent.click(doneButton);
  expect(onDone).toHaveBeenCalled();

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalled();
  fireEvent.keyDown(window, { key: 'Delete' });
  fireEvent.keyDown(window, { key: 'Backspace' });
  // expect(onLinkDeleted).toHaveBeenCalledTimes(2);
});
