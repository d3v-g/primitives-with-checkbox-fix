import * as React from 'react';
import { axe } from 'jest-axe';
import type { RenderResult } from '@testing-library/react';
import { render, fireEvent } from '@testing-library/react';
import { Checkbox, CheckboxIndicator } from '@radix-ui/react-checkbox';

const CHECKBOX_ROLE = 'checkbox';
const INDICATOR_TEST_ID = 'checkbox-indicator';

global.ResizeObserver = class ResizeObserver {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }]);
  }
  unobserve() {}
  disconnect() {}
};

describe('given a default Checkbox', () => {
  let rendered: RenderResult;
  let checkbox: HTMLElement;
  let indicator: HTMLElement | null;

  beforeEach(() => {
    rendered = render(<CheckboxTest />);
    checkbox = rendered.getByRole(CHECKBOX_ROLE);
    indicator = rendered.queryByTestId(INDICATOR_TEST_ID);
  });

  it('should have no accessibility violations', async () => {
    expect(await axe(rendered.container)).toHaveNoViolations();
  });

  describe('when clicking the checkbox', () => {
    beforeEach(async () => {
      fireEvent.click(checkbox);
      indicator = rendered.queryByTestId(INDICATOR_TEST_ID);
    });

    it('should render a visible indicator', () => {
      expect(indicator).toBeVisible();
    });

    describe('and clicking the checkbox again', () => {
      beforeEach(async () => {
        fireEvent.click(checkbox);
      });

      it('should remove the indicator', () => {
        expect(indicator).not.toBeInTheDocument();
      });
    });
  });
});

describe('given a disabled Checkbox', () => {
  let rendered: RenderResult;

  beforeEach(() => {
    rendered = render(<CheckboxTest disabled />);
  });

  it('should have no accessibility violations', async () => {
    expect(await axe(rendered.container)).toHaveNoViolations();
  });
});

describe('given an uncontrolled `checked` Checkbox', () => {
  let rendered: RenderResult;
  let checkbox: HTMLElement;
  let indicator: HTMLElement | null;
  const onCheckedChange = jest.fn();

  beforeEach(() => {
    rendered = render(<CheckboxTest defaultChecked onCheckedChange={onCheckedChange} />);
    checkbox = rendered.getByRole(CHECKBOX_ROLE);
    indicator = rendered.queryByTestId(INDICATOR_TEST_ID);
  });

  it('should have no accessibility violations', async () => {
    expect(await axe(rendered.container)).toHaveNoViolations();
  });

  describe('when clicking the checkbox', () => {
    beforeEach(async () => {
      fireEvent.click(checkbox);
    });

    it('should remove the indicator', () => {
      expect(indicator).not.toBeInTheDocument();
    });

    it('should call `onCheckedChange` prop', () => {
      expect(onCheckedChange).toHaveBeenCalled();
    });
  });
});

describe('given a controlled `checked` Checkbox', () => {
  let rendered: RenderResult;
  let checkbox: HTMLElement;
  const onCheckedChange = jest.fn();

  beforeEach(() => {
    rendered = render(<CheckboxTest checked onCheckedChange={onCheckedChange} />);
    checkbox = rendered.getByRole(CHECKBOX_ROLE);
  });

  describe('when clicking the checkbox', () => {
    beforeEach(() => {
      fireEvent.click(checkbox);
    });

    it('should call `onCheckedChange` prop', () => {
      expect(onCheckedChange).toHaveBeenCalled();
    });
  });
});

describe('given an uncontrolled Checkbox in form', () => {
  describe('when clicking the checkbox', () => {
    it('should receive change event with target `defaultChecked` same as the `defaultChecked` prop of Checkbox', (done) => {
      const rendered = render(
        <form
          onChange={(event) => {
            const target = event.target as HTMLInputElement;
            expect(target.defaultChecked).toBe(true);
          }}
        >
          <CheckboxTest defaultChecked />
        </form>
      );
      const checkbox = rendered.getByRole(CHECKBOX_ROLE);
      fireEvent.click(checkbox);
      rendered.rerender(
        <form
          onChange={(event) => {
            const target = event.target as HTMLInputElement;
            expect(target.defaultChecked).toBe(false);
            done();
          }}
        >
          <CheckboxTest defaultChecked={false} />
        </form>
      );
      fireEvent.click(checkbox);
    });

    it('should trigger a change event on BubbleInput which changes `checked` to the opposite value of `defaultChecked` of Checkbox', () => {
      const rendered = render(
        <form>
          <CheckboxTest defaultChecked />
        </form>
      );

      const checkbox = rendered.getByRole(CHECKBOX_ROLE);
      const input = rendered.getByTestId('bubble-input') as HTMLInputElement;
      fireEvent.click(checkbox);
      expect(input.checked).toBe(false);
    });
  });
});

describe('given a controlled Checkbox in a form', () => {
  describe('when clicking the checkbox', () => {
    it('should receive change event with target `defaultChecked` same as initial value of `checked` of Checkbox', (done) => {
      const rendered = render(
        <form
          onChange={(event) => {
            const target = event.target as HTMLInputElement;
            expect(target.defaultChecked).toBe(true);
          }}
        >
          <CheckboxTest checked />
        </form>
      );
      const checkbox = rendered.getByRole(CHECKBOX_ROLE);
      fireEvent.click(checkbox);
      rendered.rerender(
        <form
          onChange={(event) => {
            const target = event.target as HTMLInputElement;
            expect(target.defaultChecked).toBe(true);
            done();
          }}
        >
          <CheckboxTest checked={false} />
        </form>
      );
      fireEvent.click(checkbox);
    });

    it('should trigger a change event on BubbleInput which changes `checked` to same as initial value of `checked` of Checkbox', () => {
      const rendered = render(
        <form>
          <CheckboxTest checked />
        </form>
      );

      const checkbox = rendered.getByRole(CHECKBOX_ROLE);
      const input = rendered.getByTestId('bubble-input') as HTMLInputElement;
      fireEvent.click(checkbox);
      expect(input.checked).toBe(true);
    });
  });
});

function CheckboxTest(props: React.ComponentProps<typeof Checkbox>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // We use the `hidden` attribute to hide the nested input from both sighted users and the
    // accessibility tree. This is perfectly valid so long as users don't override the display of
    // `hidden` in CSS. Unfortunately axe doesn't recognize this, so we get a violation because the
    // input doesn't have a label. This adds an additional `aria-hidden` attribute to the input to
    // get around that.
    // https://developer.paciellogroup.com/blog/2012/05/html5-accessibility-chops-hidden-and-aria-hidden/
    const input = containerRef.current?.querySelector('input');
    input?.setAttribute('aria-hidden', 'true');
    // Add testid so that we can find the input element in tests
    input?.setAttribute('data-testid', 'bubble-input');
  }, []);
  return (
    <div ref={containerRef}>
      <Checkbox aria-label="basic checkbox" {...props}>
        <CheckboxIndicator data-testid={INDICATOR_TEST_ID} />
      </Checkbox>
    </div>
  );
}
