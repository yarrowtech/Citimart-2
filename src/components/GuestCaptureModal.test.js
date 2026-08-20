import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuestCaptureModal from "./GuestCaptureModal";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders the product name in the prompt when provided", () => {
  render(<GuestCaptureModal productName="Blue Shirt" onClose={jest.fn()} onLoginInstead={jest.fn()} />);
  expect(screen.getByText(/Blue Shirt/)).toBeInTheDocument();
});

test("submitting a valid email calls the capture-lead API and shows the sent state", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ message: "Invite sent" }),
  });

  render(<GuestCaptureModal productName="Blue Shirt" onClose={jest.fn()} onLoginInstead={jest.fn()} />);

  await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "shopper@test.com");
  await userEvent.click(screen.getByRole("button", { name: /email me a signup link/i }));

  await waitFor(() => {
    expect(screen.getByText(/invite sent/i)).toBeInTheDocument();
  });

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/guest/capture-lead"),
    expect.objectContaining({ method: "POST" })
  );
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body).toEqual({ email: "shopper@test.com", product_name: "Blue Shirt" });
});

test("shows the server's error message when capture fails", async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "Please enter a valid email address" }),
  });

  render(<GuestCaptureModal onClose={jest.fn()} onLoginInstead={jest.fn()} />);

  await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "bad@test.com");
  await userEvent.click(screen.getByRole("button", { name: /email me a signup link/i }));

  await waitFor(() => {
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
  });
});

test("clicking 'Already have an account? Log in' calls onLoginInstead", async () => {
  const onLoginInstead = jest.fn();
  render(<GuestCaptureModal onClose={jest.fn()} onLoginInstead={onLoginInstead} />);

  await userEvent.click(screen.getByText(/already have an account/i));
  expect(onLoginInstead).toHaveBeenCalledTimes(1);
});

test("clicking the close button calls onClose", async () => {
  const onClose = jest.fn();
  render(<GuestCaptureModal onClose={onClose} onLoginInstead={jest.fn()} />);

  await userEvent.click(screen.getByLabelText(/close/i));
  expect(onClose).toHaveBeenCalledTimes(1);
});
