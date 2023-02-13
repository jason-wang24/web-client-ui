import React from 'react';
import { render } from '@testing-library/react';
import { PanelManager } from '@deephaven/dashboard';
import GoldenLayout, { Config } from '@deephaven/golden-layout';
import { createMockStore } from '@deephaven/redux';
import { Provider } from 'react-redux';
import ToolType from './ToolType';
import Linker from './Linker';
import { Link } from './LinkerUtils';

const store = createMockStore();

function makeLayout() {
  return new GoldenLayout({} as Config, undefined);
}

function makePanelManager(layout = makeLayout()) {
  return new PanelManager(layout);
}

function mountLinker({
  links = [] as Link[],
  timeZone = 'TIMEZONE',
  activeTool = ToolType.LINKER,
  localDashboardId = 'TEST_ID',
  layout = makeLayout(),
  panelManager = makePanelManager(),
  setActiveTool = jest.fn(),
  setDashboardLinks = jest.fn(),
  addDashboardLinks = jest.fn(),
  deleteDashboardLinks = jest.fn(),
  setDashboardIsolatedLinkerPanelId = jest.fn(),
  setDashboardColumnSelectionValidator = jest.fn(),
} = {}) {
  return render(
    <Provider store={store}>
      <Linker
        links={links}
        timeZone={timeZone}
        activeTool={activeTool}
        localDashboardId={localDashboardId}
        layout={layout}
        panelManager={panelManager}
        setActiveTool={setActiveTool}
        setDashboardLinks={setDashboardLinks}
        addDashboardLinks={addDashboardLinks}
        deleteDashboardLinks={deleteDashboardLinks}
        setDashboardIsolatedLinkerPanelId={setDashboardIsolatedLinkerPanelId}
        setDashboardColumnSelectionValidator={
          setDashboardColumnSelectionValidator
        }
      />
    </Provider>
  );
}

it('mounts and unmounts successfully without crashing', () => {
  mountLinker();
});
