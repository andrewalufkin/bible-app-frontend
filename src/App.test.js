import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page heading', async () => {
  render(<App />);
  const headingElement = await screen.findByText(/sign in to your account/i);
  expect(headingElement).toBeInTheDocument();
});
