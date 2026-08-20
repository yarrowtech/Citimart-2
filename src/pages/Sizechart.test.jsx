import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SizeChart from "./Sizechart";

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("falls back to the general tops guide when there's no productId", async () => {
  render(<SizeChart category="Clothing" subcategory="Shirts" onClose={jest.fn()} />);

  expect(await screen.findByText(/general guide/i)).toBeInTheDocument();
  expect(screen.getByText("XS")).toBeInTheDocument();
  expect(screen.getByText("Tops / T-Shirts / Shirts")).toBeInTheDocument();
  // fetch should never be called since no productId was passed
  expect(fetch).not.toHaveBeenCalled();
});

test("falls back to the bottoms guide for jeans subcategory", async () => {
  render(<SizeChart category="Clothing" subcategory="Jeans" onClose={jest.fn()} />);
  expect(await screen.findByText("Jeans / Trousers / Shorts")).toBeInTheDocument();
  expect(screen.getByText("Waist (in)")).toBeInTheDocument();
});

test("shows product-specific chart when the backend returns real size data", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      size_chart: { M: { chest: "38", waist: "32", hips: "40", shoulder: "16", length: "28" } },
    }),
  });

  render(<SizeChart category="Clothing" productId="prod123" onClose={jest.fn()} />);

  expect(await screen.findByText(/product specific/i)).toBeInTheDocument();
  expect(screen.getByText("38")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/products/prod123/sizechart"));
});

test("builds chart from variant measurements when API returns nothing", async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ size_chart: {} }) });

  const variants = [
    { size: "M", measurements: { chest: "40", waist: "34" } },
  ];
  render(<SizeChart category="Clothing" productId="prod456" variants={variants} onClose={jest.fn()} />);

  await waitFor(() => {
    expect(screen.queryByText(/loading size chart/i)).not.toBeInTheDocument();
  });
  expect(screen.getByText(/product specific/i)).toBeInTheDocument();
  expect(screen.getByText("40")).toBeInTheDocument();
});

test("shows an uploaded image chart when no API or variant data exists", async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ size_chart: {} }) });

  render(
    <SizeChart
      category="Clothing"
      productId="prod789"
      sizeChartUrl="https://example.com/chart.png"
      onClose={jest.fn()}
    />
  );

  const img = await screen.findByAltText(/size chart/i);
  expect(img).toHaveAttribute("src", "https://example.com/chart.png");
});

test("calls onClose when the close button is clicked", async () => {
  const onClose = jest.fn();
  render(<SizeChart category="Clothing" onClose={onClose} />);

  await screen.findByText(/general guide/i);
  await userEvent.click(screen.getByText("×"));
  expect(onClose).toHaveBeenCalledTimes(1);
});
