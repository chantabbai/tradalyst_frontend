"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { ChevronUpIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { Upload, Download } from "lucide-react";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export interface Trade {
  id?: string;
  _id?: string;
  userId?: string;
  date: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  type: string;
  optionType?: string;
  strategy: string;
  notes?: string;
  exits: Exit[];
  status: "OPEN" | "CLOSED" | "PARTIALLY_CLOSED";
  totalProfit?: number;
  totalProfitPercentage?: number;
  remainingQuantity?: number;
}

interface Exit {
  exitDate: string;
  exitPrice: number;
  exitQuantity: number;
  profit: number;
  profitPercentage: number;
}

interface ParsedTrade {
  runDate: string;
  action: string;
  symbol: string;
  description: string;
  type: "Margin" | "Cash";
  quantity: number;
  price: number;
  commission: number;
  fees: number;
  amount: number;
}

interface ImportedTrade {
  symbol: string;
  fullSymbol: string;
  entryDate: string;
  action: string;
  quantity: number;
  price: number;
  type: string;
  optionType?: string;
  strikePrice?: number;
  expirationDate?: string;
  status: string;
  exits: Exit[];
  totalProfit?: number;
  totalProfitPercentage?: number;
}

export default function JournalContent() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    date: "",
    symbol: "",
    action: "buy",
    quantity: 0,
    price: 0,
    type: "stock",
    strategy: "",
    notes: "",
  });
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [exitingTrade, setExitingTrade] = useState<Trade | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [priceError, setPriceError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [exitErrors, setExitErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTrades, setBulkTrades] = useState<Partial<Trade>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<{
    [key: number]: { [key: string]: string };
  }>({});

  useEffect(() => {
    if (user?.id) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    try {
      if (!user?.id) {
        console.error("User ID is not available");
        return;
      }
      const response = await axiosInstance.get(`/api/trades/user/${user.id}`);
      setTrades(response.data);
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast({
        title: "Error",
        description: "Failed to fetch trades. Please try again.",
        variant: "destructive",
      } as any);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewTrade((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    if (name === "type" && value === "stock") {
      // When switching to stock, remove optionType
      const { optionType, ...rest } = newTrade;
      setNewTrade({ ...rest, [name]: value });
    } else if (name === "type" && value === "option") {
      // When switching to option, add default optionType
      setNewTrade((prev) => ({ ...prev, [name]: value, optionType: "call" }));
    } else {
      // For other radio changes (like optionType)
      setNewTrade((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddTrade = async () => {
    console.log("handleAddTrade called", newTrade);
    const errors: { [key: string]: string } = {};

    // Validation for required fields
    if (!newTrade.symbol) {
      errors.symbol = "Symbol is required";
    }
    if (!newTrade.date) {
      errors.date = "Date is required";
    }
    if (!newTrade.quantity || newTrade.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }
    if (!newTrade.price || newTrade.price <= 0) {
      errors.price = "Price must be greater than 0";
    }
    if (!newTrade.type) {
      errors.type = "Type is required";
    }
    if (newTrade.type === "option" && !newTrade.optionType) {
      errors.optionType = "Option type is required";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log("Validation failed", errors);
      toast({
        title: "Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      } as any);
      return;
    }

    setPriceError(null);
    try {
      const tradeToSave = {
        ...newTrade,
        userId: user?.id,
        quantity: Number(newTrade.quantity),
        price: Number(newTrade.price),
        entryDate: newTrade.date,
        optionType:
          newTrade.type === "option" ? newTrade.optionType : undefined,
      };
      console.log("Sending trade to backend:", tradeToSave);
      const response = await axiosInstance.post("/api/trades", tradeToSave);
      console.log("Response from backend:", response.data);

      // Update the trades state with the new trade
      setTrades((prevTrades) => [...prevTrades, response.data]);

      // Reset the form to default values including radio buttons
      setNewTrade({
        date: "",
        symbol: "",
        action: "buy",
        quantity: 0,
        price: 0,
        type: "stock", // Reset to stock
        optionType: undefined,
        strategy: "", // Keep strategy as empty string
        notes: "",
      });

      // Clear any form errors
      setFormErrors({});
      setPriceError(null);

      toast({
        title: "Trade Added",
        description: "Your trade has been successfully added to the journal.",
      } as any);

      fetchTrades();
    } catch (error) {
      console.error(
        "Error adding trade:",
        error.response?.data || error.message,
      );
      toast({
        title: "Error",
        description: "Failed to add trade. Please try again.",
        variant: "destructive",
      } as any);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
  };

  const handleUpdateTrade = async () => {
    if (editingTrade) {
      try {
        console.log("Updating trade with data:", editingTrade); // Added log
        const updatedTrade = {
          ...editingTrade,
          entryDate: editingTrade.entryDate, // Log the date specifically
          quantity: Number(editingTrade.quantity),
          price: Number(editingTrade.price),
        };
        console.log("Sending update request with:", updatedTrade); // Added log
        const response = await axiosInstance.put(
          `/api/trades/${updatedTrade.id}`,
          updatedTrade,
        );
        console.log("Update response:", response.data); // Added log
        const updatedTrades = trades.map((t) =>
          t.id === updatedTrade.id ? response.data : t,
        );
        setTrades(updatedTrades);
        setEditingTrade(null);
        toast({
          title: "Trade Updated",
          description: "Your trade has been successfully updated.",
        });
      } catch (error) {
        console.error("Error updating trade:", error);
        console.error("Error details:", error.response?.data); // Added detailed error log
        toast({
          title: "Error",
          description: "Failed to update trade. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExitTrade = (trade: Trade) => {
    setExitingTrade({
      ...trade,
      exitDate: getCurrentDate(), // Set default exit date to today
    });
  };

  const handleRecordExit = async () => {
    if (exitingTrade) {
      const errors: { [key: string]: string } = {};

      if (!exitingTrade.exitDate) {
        errors.exitDate = "Exit Date is required";
      }
      if (!exitingTrade.exitPrice || exitingTrade.exitPrice <= 0) {
        errors.exitPrice = "Exit Price must be greater than 0";
      }
      if (!exitingTrade.exitQuantity || exitingTrade.exitQuantity <= 0) {
        errors.exitQuantity = "Exit Quantity must be greater than 0";
      }

      // Check against remaining quantity for partially closed trades
      const quantityToCheck =
        exitingTrade.status === "PARTIALLY_CLOSED"
          ? exitingTrade.remainingQuantity
          : exitingTrade.quantity;

      if (exitingTrade.exitQuantity > quantityToCheck) {
        errors.exitQuantity =
          exitingTrade.status === "PARTIALLY_CLOSED"
            ? `Exit Quantity (${exitingTrade.exitQuantity}) cannot exceed the remaining quantity (${quantityToCheck})`
            : `Exit Quantity (${exitingTrade.exitQuantity}) cannot exceed the trade quantity (${quantityToCheck})`;
      }

      setExitErrors(errors);

      if (Object.keys(errors).length > 0) {
        console.log("Exit validation failed", errors);
        toast({
          title: "Error",
          description: "Please fill in all required fields correctly.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await axiosInstance.post(
          `/api/trades/${exitingTrade.id}/exit`,
          {
            exitDate: exitingTrade.exitDate,
            exitPrice: Number(exitingTrade.exitPrice),
            exitQuantity: Number(exitingTrade.exitQuantity),
          },
        );
        const updatedTrade = response.data;
        const updatedTrades = trades.map((t) =>
          t.id === updatedTrade.id ? updatedTrade : t,
        );
        setTrades(updatedTrades);
        setExitingTrade(null);
        toast({
          title: "Exit Recorded",
          description: "Your trade exit has been successfully recorded.",
        });
      } catch (error) {
        console.error("Error recording trade exit:", error);
        toast({
          title: "Error",
          description: "Failed to record trade exit. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const openTrades = trades.filter(
    (trade) =>
      trade.status === "OPEN" ||
      (trade.status === "PARTIALLY_CLOSED" && trade.remainingQuantity > 0),
  );
  const closedTrades = trades.filter(
    (trade) =>
      trade.status === "CLOSED" ||
      (trade.status === "PARTIALLY_CLOSED" && trade.exits.length > 0),
  );

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const processCSVTrades = (csvContent: string) => {
    const trades = new Map<
      string,
      {
        openTrade: Trade;
        closingTrades: Trade[];
        remainingQuantity: number;
      }
    >();

    const createTradeKey = (
      symbol: string,
      type: string,
      strike?: number,
      expiry?: string,
      optionType?: string,
    ) => {
      return type === "stock"
        ? `${symbol}_stock`
        : `${symbol}_${optionType}_${strike}_${expiry}`;
    };

    const parseSymbol = (rawSymbol: string, description: string) => {
      // For stock trades
      if (!description.includes("PUT") && !description.includes("CALL")) {
        return {
          symbol: rawSymbol,
          type: "stock",
        };
      }

      // For option trades (e.g., -SPY241115P575)
      const match = rawSymbol.match(
        /^-?(\w+)(\d{2})(\d{2})(\d{2})([CP])(\d+)$/,
      );
      if (match) {
        const [_, symbol, yy, mm, dd, optionType, strike] = match;
        return {
          symbol,
          type: "option",
          optionType: optionType === "C" ? "call" : "put",
          strike: parseInt(strike),
          expiry: `20${yy}-${mm}-${dd}`,
        };
      }

      return null;
    };

    const rows = csvContent.split("\n").slice(1); // Skip header
    const parsedTrades: ParsedTrade[] = rows.map((row) => {
      const [
        runDate,
        action,
        symbol,
        description,
        type,
        quantity,
        price,
        commission,
        fees,
        _,
        amount,
      ] = row.split("\t");

      return {
        runDate,
        action,
        symbol,
        description,
        type: type as "Margin" | "Cash",
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        commission: parseFloat(commission),
        fees: parseFloat(fees),
        amount: parseFloat(amount),
      };
    });

    // Sort by date to process oldest trades first
    parsedTrades.sort(
      (a, b) => new Date(a.runDate).getTime() - new Date(b.runDate).getTime(),
    );

    // Process each trade
    parsedTrades.forEach((parsedTrade) => {
      const symbolInfo = parseSymbol(
        parsedTrade.symbol,
        parsedTrade.description,
      );
      if (!symbolInfo) return;

      const tradeKey = createTradeKey(
        symbolInfo.symbol,
        symbolInfo.type,
        symbolInfo.strike,
        symbolInfo.expiry,
        symbolInfo.optionType,
      );

      const isOpening = parsedTrade.action.includes("OPENING TRANSACTION");
      const isBuy = parsedTrade.action.includes("BOUGHT");

      if (isOpening) {
        // Create new trade entry
        const newTrade: Trade = {
          date: parsedTrade.runDate,
          symbol: symbolInfo.symbol,
          action: isBuy ? "buy" : "sell",
          quantity: Math.abs(parsedTrade.quantity),
          price: parsedTrade.price,
          type: symbolInfo.type,
          optionType: symbolInfo.optionType,
          strategy: "", // User can update later
          status: "OPEN",
          exits: [],
          remainingQuantity: Math.abs(parsedTrade.quantity),
        };

        trades.set(tradeKey, {
          openTrade: newTrade,
          closingTrades: [],
          remainingQuantity: Math.abs(parsedTrade.quantity),
        });
      } else {
        // Find matching open trade
        const position = trades.get(tradeKey);
        if (position) {
          const exit = {
            exitDate: parsedTrade.runDate,
            exitPrice: parsedTrade.price,
            exitQuantity: Math.abs(parsedTrade.quantity),
            profit: 0, // Will be calculated
            profitPercentage: 0, // Will be calculated
          };

          position.closingTrades.push({
            ...position.openTrade,
            exits: [exit],
            status:
              position.remainingQuantity === Math.abs(parsedTrade.quantity)
                ? "CLOSED"
                : "PARTIALLY_CLOSED",
            remainingQuantity:
              position.remainingQuantity - Math.abs(parsedTrade.quantity),
          });

          position.remainingQuantity -= Math.abs(parsedTrade.quantity);
        }
      }
    });

    return Array.from(trades.values());
  };

  const handleImportClick = () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to import trades",
        variant: "destructive",
      } as any);
      return;
    }
    fileInputRef.current?.click();
  };

  // Add this function to help debug CSV issues
  const debugCsvImport = async (content: string) => {
    try {
      const response = await axiosInstance.post("/api/trades/import/debug", {
        content: content,
      });
      console.log("CSV Debug Info:", response.data);
      return response.data;
    } catch (error) {
      console.error("Debug Error:", error);
      return null;
    }
  };

  // Update handleFileUpload to include debug option
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          let content = (e.target?.result as string)
            .replace(/^\uFEFF/, "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

          content = content
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .join("\n")
            .trim();

          resolve(content);
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file, "UTF-8");
      });

      if (!fileContent.trim()) {
        throw new Error("File is empty");
      }

      const response = await axiosInstance.post("/api/trades/import", {
        content: fileContent,
        userId: user?.id,
        fileName: file.name,
      });

      if (response.data) {
        await fetchTrades();
        setIsDialogOpen(false); // Close dialog immediately
        setImportSuccess(null); // Clear success message
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);

      let errorMessage =
        "Failed to import trades. Please check the file format.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === "Failed to read file") {
        errorMessage = "Failed to read the file. Please try again.";
      } else if (error.message === "File is empty") {
        errorMessage = "The file appears to be empty.";
      }

      setImportError(errorMessage);
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Add this helper function to validate CSV content
  const validateCsvContent = (content: string): boolean => {
    try {
      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        console.error("CSV has less than 2 lines");
        return false;
      }

      // Check for headers
      const firstLine = lines[0].toLowerCase();
      console.log("First line:", firstLine);

      // Check if it's a valid Fidelity format
      const hasFidelityHeaders =
        firstLine.includes("run date") &&
        firstLine.includes("action") &&
        firstLine.includes("symbol");

      if (!hasFidelityHeaders) {
        console.error("Missing required Fidelity headers");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating CSV:", error);
      return false;
    }
  };

  // Add this function to handle adding a new row
  const addNewTradeRow = () => {
    setBulkTrades([
      ...bulkTrades,
      {
        date: "",
        symbol: "",
        action: "buy",
        quantity: 0,
        price: 0,
        type: "stock",
        strategy: "",
        notes: "",
      },
    ]);
  };

  // Update the validateTrade function to show all validation errors
  const validateTrade = (trade: Partial<Trade>) => {
    const errors: { [key: string]: string } = {};

    if (!trade.symbol) {
      errors.symbol = "Symbol is required";
    }
    if (!trade.date) {
      errors.date = "Date is required";
    }
    if (!trade.quantity || trade.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }
    if (!trade.price || trade.price <= 0) {
      errors.price = "Price must be greater than 0";
    }
    if (!trade.type) {
      errors.type = "Type is required";
    }
    if (trade.type === "option" && !trade.optionType) {
      errors.optionType = "Option type is required";
    }

    return errors;
  };

  // Move the form rendering logic into a separate function
  const renderForm = () => {
    if (bulkMode) {
      return (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkTrades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell className="p-0">
                      <div className="space-y-1">
                        <Input
                          type="date"
                          value={trade.date || ""}
                          onChange={(e) => {
                            const newTrades = [...bulkTrades];
                            newTrades[index] = {
                              ...trade,
                              date: e.target.value,
                            };
                            setBulkTrades(newTrades);

                            // Validate immediately
                            const errors = validateTrade(newTrades[index]);
                            const newErrors = { ...bulkErrors };
                            if (errors.date) {
                              newErrors[index] = {
                                ...newErrors[index],
                                date: errors.date,
                              };
                            } else {
                              if (newErrors[index]) {
                                delete newErrors[index].date;
                                if (
                                  Object.keys(newErrors[index]).length === 0
                                ) {
                                  delete newErrors[index];
                                }
                              }
                            }
                            setBulkErrors(newErrors);
                          }}
                          className={`border-0 focus:ring-0 ${bulkErrors[index]?.date ? "border-red-500" : ""}`}
                          max={getCurrentDate()}
                        />
                        {bulkErrors[index]?.date && (
                          <div className="text-xs text-red-500 px-2">
                            {bulkErrors[index].date}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="space-y-1">
                        <Input
                          value={trade.symbol || ""}
                          onChange={(e) => {
                            const newTrades = [...bulkTrades];
                            newTrades[index] = {
                              ...trade,
                              symbol: e.target.value.toUpperCase(),
                            };
                            setBulkTrades(newTrades);

                            // Validate immediately
                            const errors = validateTrade(newTrades[index]);
                            const newErrors = { ...bulkErrors };
                            if (errors.symbol) {
                              newErrors[index] = {
                                ...newErrors[index],
                                symbol: errors.symbol,
                              };
                            } else {
                              if (newErrors[index]) {
                                delete newErrors[index].symbol;
                                if (
                                  Object.keys(newErrors[index]).length === 0
                                ) {
                                  delete newErrors[index];
                                }
                              }
                            }
                            setBulkErrors(newErrors);
                          }}
                          className={`border-0 focus:ring-0 ${bulkErrors[index]?.symbol ? "border-red-500" : ""}`}
                        />
                        {bulkErrors[index]?.symbol && (
                          <div className="text-xs text-red-500 px-2">
                            {bulkErrors[index].symbol}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="flex flex-col gap-1">
                        <Select
                          value={trade.type}
                          onValueChange={(value) => {
                            const newTrades = [...bulkTrades];
                            newTrades[index] = {
                              ...trade,
                              type: value,
                              optionType:
                                value === "option" ? "call" : undefined,
                            };
                            setBulkTrades(newTrades);
                          }}
                        >
                          <SelectTrigger className="border-0 focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="option">Option</SelectItem>
                          </SelectContent>
                        </Select>

                        {trade.type === "option" && (
                          <Select
                            value={trade.optionType}
                            onValueChange={(value) => {
                              const newTrades = [...bulkTrades];
                              newTrades[index] = {
                                ...trade,
                                optionType: value,
                              };
                              setBulkTrades(newTrades);
                            }}
                          >
                            <SelectTrigger className="border-0 focus:ring-0">
                              <SelectValue placeholder="Option Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Call</SelectItem>
                              <SelectItem value="put">Put</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <Select
                        value={trade.action}
                        onValueChange={(value) => {
                          const newTrades = [...bulkTrades];
                          newTrades[index] = { ...trade, action: value };
                          setBulkTrades(newTrades);
                        }}
                      >
                        <SelectTrigger className="border-0 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Long</SelectItem>
                          <SelectItem value="sell">Short</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={trade.quantity || ""}
                          onChange={(e) => {
                            const newTrades = [...bulkTrades];
                            newTrades[index] = {
                              ...trade,
                              quantity: Number(e.target.value),
                            };
                            setBulkTrades(newTrades);

                            // Validate immediately
                            const errors = validateTrade(newTrades[index]);
                            const newErrors = { ...bulkErrors };
                            if (errors.quantity) {
                              newErrors[index] = {
                                ...newErrors[index],
                                quantity: errors.quantity,
                              };
                            } else {
                              if (newErrors[index]) {
                                delete newErrors[index].quantity;
                                if (
                                  Object.keys(newErrors[index]).length === 0
                                ) {
                                  delete newErrors[index];
                                }
                              }
                            }
                            setBulkErrors(newErrors);
                          }}
                          className={`border-0 focus:ring-0 ${bulkErrors[index]?.quantity ? "border-red-500" : ""}`}
                        />
                        {bulkErrors[index]?.quantity && (
                          <div className="text-xs text-red-500 px-2">
                            {bulkErrors[index].quantity}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={trade.price || ""}
                          onChange={(e) => {
                            const newTrades = [...bulkTrades];
                            newTrades[index] = {
                              ...trade,
                              price: Number(e.target.value),
                            };
                            setBulkTrades(newTrades);

                            // Validate immediately
                            const errors = validateTrade(newTrades[index]);
                            const newErrors = { ...bulkErrors };
                            if (errors.price) {
                              newErrors[index] = {
                                ...newErrors[index],
                                price: errors.price,
                              };
                            } else {
                              if (newErrors[index]) {
                                delete newErrors[index].price;
                                if (
                                  Object.keys(newErrors[index]).length === 0
                                ) {
                                  delete newErrors[index];
                                }
                              }
                            }
                            setBulkErrors(newErrors);
                          }}
                          className={`border-0 focus:ring-0 ${bulkErrors[index]?.price ? "border-red-500" : ""}`}
                          step="0.01"
                        />
                        {bulkErrors[index]?.price && (
                          <div className="text-xs text-red-500 px-2">
                            {bulkErrors[index].price}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-0">
                      <div className="space-y-1">
                        <Input
                          value={trade.strategy || ""}
                          onChange={(e) => {
                            const newTrades = [...bulkTrades];
                            newTrades[index] = {
                              ...trade,
                              strategy: e.target.value,
                            };
                            setBulkTrades(newTrades);

                            // Validate immediately
                            const errors = validateTrade(newTrades[index]);
                            const newErrors = { ...bulkErrors };
                            if (errors.strategy) {
                              newErrors[index] = {
                                ...newErrors[index],
                                strategy: errors.strategy,
                              };
                            } else {
                              if (newErrors[index]) {
                                delete newErrors[index].strategy;
                                if (
                                  Object.keys(newErrors[index]).length === 0
                                ) {
                                  delete newErrors[index];
                                }
                              }
                            }
                            setBulkErrors(newErrors);
                          }}
                          className={`border-0 focus:ring-0 ${bulkErrors[index]?.strategy ? "border-red-500" : ""}`}
                        />
                        {bulkErrors[index]?.strategy && (
                          <div className="text-xs text-red-500 px-2">
                            {bulkErrors[index].strategy}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newTrades = bulkTrades.filter(
                            (_, i) => i !== index,
                          );
                          setBulkTrades(newTrades);

                          // Clear errors for the deleted row and reindex remaining errors
                          const newErrors = { ...bulkErrors };
                          delete newErrors[index];

                          // Reindex errors for remaining rows
                          const reindexedErrors: {
                            [key: number]: { [key: string]: string };
                          } = {};
                          Object.keys(newErrors).forEach((key) => {
                            const numKey = parseInt(key);
                            if (numKey > index) {
                              reindexedErrors[numKey - 1] = newErrors[numKey];
                            } else {
                              reindexedErrors[numKey] = newErrors[numKey];
                            }
                          });

                          setBulkErrors(reindexedErrors);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={addNewTradeRow}>
              Add Row
            </Button>
            {bulkTrades.length > 0 && ( // Only show Save All if there are trades
              <Button type="button" onClick={handleBulkSave}>
                Save All
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      // Single entry form
      <>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Entry Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={newTrade.date || ""}
              onChange={handleInputChange}
              max={getCurrentDate()}
              required
            />
            {formErrors.date && (
              <span className="text-red-500 text-sm">{formErrors.date}</span>
            )}
          </div>
          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              name="symbol"
              value={newTrade.symbol || ""}
              onChange={(e) =>
                handleInputChange({
                  ...e,
                  target: {
                    ...e.target,
                    value: e.target.value.toUpperCase(),
                    name: "symbol",
                  },
                })
              }
              required
            />
            {formErrors.symbol && (
              <span className="text-red-500 text-sm">{formErrors.symbol}</span>
            )}
          </div>
          <div>
            <Label htmlFor="action">Action</Label>
            <Select
              value={newTrade.action}
              onValueChange={(value) => handleSelectChange("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={newTrade.quantity || ""}
              onChange={handleInputChange}
              required
            />
            {formErrors.quantity && (
              <span className="text-red-500 text-sm">
                {formErrors.quantity}
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={newTrade.price || ""}
              onChange={handleInputChange}
              required
              min="0.01"
              step="0.01"
            />
            {formErrors.price && (
              <span className="text-red-500 text-sm">{formErrors.price}</span>
            )}
          </div>
          <div>
            <Label htmlFor="strategy">Strategy</Label>
            <Input
              id="strategy"
              name="strategy"
              value={newTrade.strategy || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="col-span-2">
            <Label>Type</Label>
            <RadioGroup
              defaultValue="stock"
              onValueChange={(value) => handleRadioChange("type", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stock" id="stock" />
                <Label htmlFor="stock">Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option" id="option" />
                <Label htmlFor="option">Option</Label>
              </div>
            </RadioGroup>
          </div>
          {newTrade.type === "option" && (
            <div className="col-span-2">
              <Label>Option Type</Label>
              <RadioGroup
                defaultValue="call"
                onValueChange={(value) =>
                  handleRadioChange("optionType", value)
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="call" id="call" />
                  <Label htmlFor="call">Call</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="put" id="put" />
                  <Label htmlFor="put">Put</Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
        <Button type="button" onClick={handleAddTrade}>
          Add Trade
        </Button>
      </>
    );
  };

  // Update the handleBulkSave function
  const handleBulkSave = async () => {
    try {
      // Check if there are any trades to save
      if (bulkTrades.length === 0) {
        setBulkErrors({
          0: { general: "No trades to save. Please add at least one trade." },
        });
        return;
      }

      // Clear previous errors
      setBulkErrors({});

      // Validate all trades first
      let hasErrors = false;
      const newErrors: { [key: number]: { [key: string]: string } } = {};

      bulkTrades.forEach((trade, index) => {
        const errors = validateTrade(trade);
        if (Object.keys(errors).length > 0) {
          hasErrors = true;
          newErrors[index] = errors;
        }
      });

      if (hasErrors) {
        setBulkErrors(newErrors);
        return;
      }

      // Save all trades
      const savedTrades = [];
      for (const trade of bulkTrades) {
        try {
          const tradeData = {
            ...trade,
            userId: user?.id,
            status: "OPEN",
            exits: [],
            entryDate: trade.date,
          };

          const response = await axiosInstance.post("/api/trades", tradeData);
          if (response.data) {
            savedTrades.push(response.data);
          }
        } catch (error: any) {
          setBulkErrors({
            general: `Failed to save trade for ${trade.symbol || "Unknown Symbol"}: ${error.response?.data?.message || "Unknown error"}`,
          });
          return;
        }
      }

      if (savedTrades.length === bulkTrades.length) {
        await fetchTrades();
        setBulkTrades([]);
        setBulkMode(false);
      }
    } catch (error: any) {
      setBulkErrors({
        general: error.response?.data?.message || "Failed to save trades",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-muted/20">
          <span className="text-sm text-muted-foreground">Single</span>
          <Switch
            checked={bulkMode}
            onCheckedChange={(checked) => {
              setBulkMode(checked);
              if (checked) {
                addNewTradeRow();
              } else {
                setBulkTrades([]);
                setBulkErrors({});
              }
            }}
          />
          <span className="text-sm text-muted-foreground">Bulk</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
            ref={fileInputRef}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  setIsDialogOpen(true);
                  setImportError(null);
                  setImportSuccess(null);
                }}
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Trades</DialogTitle>
                <DialogDescription>
                  Import your trades from your broker's exported files. We
                  support various formats including Fidelity and generic CSV
                  files.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {isImporting ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">
                      Processing your trades...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This may take a few moments
                    </p>
                  </div>
                ) : (
                  <>
                    {importError && (
                      <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                        {importError}
                      </div>
                    )}
                    {importSuccess && (
                      <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-3 rounded-md text-sm">
                        {importSuccess}
                      </div>
                    )}
                    {!importSuccess && (
                      <>
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <Label>Supported Brokers</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">
                                    F
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    Fidelity
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Activity & Orders
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">
                                    RH
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    Robinhood
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Account History
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Select File to Import
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            onClick={() =>
                              document.getElementById("csv-upload")?.click()
                            }
                            className="w-full h-24 border-dashed"
                            disabled={isImporting}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Click to select file
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Supports .csv and .txt files
                              </span>
                            </div>
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        <form className="space-y-4">{renderForm()}</form>
      </div>

      <Tabs defaultValue="open" className="space-y-2">
        <TabsList>
          <TabsTrigger value="open">Open Trades</TabsTrigger>
          <TabsTrigger value="closed">Closed Trades</TabsTrigger>
        </TabsList>
        <TabsContent value="open">
          <TradeTable
            trades={openTrades}
            onEdit={handleEditTrade}
            onExit={handleExitTrade}
            onFetchTrades={fetchTrades}
          />
        </TabsContent>
        <TabsContent value="closed">
          <TradeTable
            trades={closedTrades}
            onEdit={handleEditTrade}
            onExit={handleExitTrade}
            onFetchTrades={fetchTrades}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingTrade} onOpenChange={() => setEditingTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          {editingTrade && (
            <form className="space-y-4">
              <div>
                <Label htmlFor="editDate">Entry Date</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editingTrade.entryDate}
                  onChange={(e) => {
                    console.log("Date input changed:", e.target.value); // Added log
                    setEditingTrade({
                      ...editingTrade,
                      entryDate: e.target.value,
                    });
                    console.log("Updated editingTrade:", editingTrade); // Added log
                  }}
                  max={getCurrentDate()}
                />
              </div>
              <div>
                <Label htmlFor="editSymbol">Symbol</Label>
                <Input
                  id="editSymbol"
                  value={editingTrade.symbol}
                  onChange={(e) =>
                    setEditingTrade({ ...editingTrade, symbol: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editAction">Action</Label>
                <Select
                  value={editingTrade.action}
                  onValueChange={(value) =>
                    setEditingTrade({ ...editingTrade, action: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  value={editingTrade.quantity}
                  onChange={(e) =>
                    setEditingTrade({
                      ...editingTrade,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editPrice">Price</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={editingTrade.price}
                  onChange={(e) =>
                    setEditingTrade({
                      ...editingTrade,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editType">Type</Label>
                <RadioGroup
                  value={editingTrade.type}
                  onValueChange={(value) =>
                    setEditingTrade({ ...editingTrade, type: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stock" id="editStock" />
                    <Label htmlFor="editStock">Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option" id="editOption" />
                    <Label htmlFor="editOption">Option</Label>
                  </div>
                </RadioGroup>
              </div>
              {editingTrade.type === "option" && (
                <div>
                  <Label htmlFor="editOptionType">Option Type</Label>
                  <RadioGroup
                    value={editingTrade.optionType}
                    onValueChange={(value) =>
                      setEditingTrade({ ...editingTrade, optionType: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="call" id="editCall" />
                      <Label htmlFor="editCall">Call</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="put" id="editPut" />
                      <Label htmlFor="editPut">Put</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              <div>
                <Label htmlFor="editStrategy">Strategy</Label>
                <Input
                  id="editStrategy"
                  value={editingTrade.strategy}
                  onChange={(e) =>
                    setEditingTrade({
                      ...editingTrade,
                      strategy: e.target.value,
                    })
                  }
                />
              </div>
              <Button type="button" onClick={handleUpdateTrade}>
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!exitingTrade} onOpenChange={() => setExitingTrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Exit</DialogTitle>
          </DialogHeader>
          {exitingTrade && (
            <form className="space-y-4">
              <div>
                <Label htmlFor="exitDate">Exit Date</Label>
                <Input
                  id="exitDate"
                  type="date"
                  value={exitingTrade.exitDate || ""}
                  onChange={(e) =>
                    setExitingTrade({
                      ...exitingTrade,
                      exitDate: e.target.value,
                    })
                  }
                  min={exitingTrade.entryDate} // Changed from date to entryDate
                  max={getCurrentDate()}
                  onKeyDown={(e) => e.preventDefault()} // Prevent typing
                />
                {exitErrors.exitDate && (
                  <span className="text-red-500 text-sm">
                    {exitErrors.exitDate}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="exitPrice">Exit Price</Label>
                <Input
                  id="exitPrice"
                  type="number"
                  value={exitingTrade.exitPrice || ""}
                  onChange={(e) =>
                    setExitingTrade({
                      ...exitingTrade,
                      exitPrice: Number(e.target.value),
                    })
                  }
                  min="0.01"
                  step="0.01"
                />
                {exitErrors.exitPrice && (
                  <span className="text-red-500 text-sm">
                    {exitErrors.exitPrice}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="exitQuantity">Exit Quantity</Label>
                <Input
                  id="exitQuantity"
                  type="number"
                  value={exitingTrade.exitQuantity || ""}
                  onChange={(e) =>
                    setExitingTrade({
                      ...exitingTrade,
                      exitQuantity: Number(e.target.value),
                    })
                  }
                  min="1"
                  max={exitingTrade.quantity}
                />
                {exitErrors.exitQuantity && (
                  <span className="text-red-500 text-sm">
                    {exitErrors.exitQuantity}
                  </span>
                )}
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleRecordExit}>
                  Record Exit
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TradeTable({
  trades,
  onEdit,
  onExit,
  onFetchTrades,
}: {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onExit: (trade: Trade) => void;
  onFetchTrades: () => void;
}) {
  const isClosedTab = trades.some((trade) => trade.status === "CLOSED");
  const hasPartiallyClosedTrades = trades.some(
    (trade) => trade.status === "PARTIALLY_CLOSED",
  );

  // Set default sort column based on the tab
  const [sortColumn, setSortColumn] = useState<keyof Trade>(
    isClosedTab ? "exitDate" : "entryDate",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(trades.length / itemsPerPage);

  // Reset to first page when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (column: keyof Trade) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort trades first
  const sortedTrades = [...trades].sort((a, b) => {
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];

    // Handle special cases for exitDate
    if (sortColumn === "exitDate") {
      aValue =
        a.exits && a.exits.length > 0
          ? new Date(a.exits[a.exits.length - 1].exitDate).getTime()
          : 0;
      bValue =
        b.exits && b.exits.length > 0
          ? new Date(b.exits[b.exits.length - 1].exitDate).getTime()
          : 0;
    } else if (sortColumn === "entryDate") {
      aValue = a.entryDate ? new Date(a.entryDate).getTime() : 0;
      bValue = b.entryDate ? new Date(b.entryDate).getTime() : 0;
    }

    // Compare values
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Then paginate the sorted trades
  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const SortableHeader = ({
    column,
    children,
  }: {
    column: keyof Trade;
    children: React.ReactNode;
  }) => (
    <TableHead className="cursor-pointer" onClick={() => handleSort(column)}>
      <div className="flex items-center">
        {children}
        {sortColumn === column &&
          (sortDirection === "asc" ? (
            <ChevronUpIcon className="ml-1" />
          ) : (
            <ChevronDownIcon className="ml-1" />
          ))}
      </div>
    </TableHead>
  );

  // Update the handleStrategyUpdate function
  const handleStrategyUpdate = async (trade: Trade, newStrategy: string) => {
    try {
      const updatedTrade = { ...trade, strategy: newStrategy };
      const response = await axiosInstance.put(
        `/api/trades/${trade.id}`,
        updatedTrade,
      );
      if (response.status === 200) {
        // Update the local trades state through the parent component
        const updatedTrades = trades.map((t) =>
          t.id === trade.id ? { ...t, strategy: newStrategy } : t,
        );
        // Notify success
        toast({
          title: "Success",
          description: "Strategy updated successfully",
        } as any);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update strategy",
        variant: "destructive",
      } as any);
    }
  };

  // Add this helper function at the top of the file
  const generatePaginationRange = (currentPage: number, totalPages: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l: number;

    range.push(1);

    if (totalPages <= 1) return range;

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }
    range.push(totalPages);

    for (let i = 0; i < range.length; i++) {
      if (l) {
        if (range[i] - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (range[i] - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(range[i]);
      l = range[i];
    }

    return rangeWithDots;
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full overflow-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {isClosedTab && (
                <TableHead className="whitespace-nowrap">
                  <div className="flex items-center">Outcome</div>
                </TableHead>
              )}
              <SortableHeader column="entryDate" className="whitespace-nowrap">
                Entry Date
              </SortableHeader>
              <SortableHeader column="symbol" className="whitespace-nowrap">
                Symbol
              </SortableHeader>
              <SortableHeader column="action" className="whitespace-nowrap">
                Action
              </SortableHeader>
              <SortableHeader column="quantity" className="whitespace-nowrap">
                Qty
              </SortableHeader>
              <SortableHeader column="price" className="whitespace-nowrap">
                Price
              </SortableHeader>
              <SortableHeader column="type" className="whitespace-nowrap">
                Type
              </SortableHeader>
              <SortableHeader column="strategy" className="whitespace-nowrap">
                <div className="relative group flex items-center gap-2">
                  Strategy
                  <div className="relative group">
                    <svg
                      className="h-4 w-4 text-muted-foreground cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="absolute left-1/2 -translate-x-1/2 top-6 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap z-[100]">
                      Click on strategy field to edit
                    </span>
                  </div>
                </div>
              </SortableHeader>
              <SortableHeader column="status" className="whitespace-nowrap">
                Status
              </SortableHeader>
              {hasPartiallyClosedTrades && (
                <SortableHeader
                  column="remainingQuantity"
                  className="whitespace-nowrap"
                >
                  Rem. Qty
                </SortableHeader>
              )}
              {isClosedTab && (
                <SortableHeader
                  column="exitPrice"
                  className="whitespace-nowrap"
                >
                  Exit Price
                </SortableHeader>
              )}
              {isClosedTab && (
                <SortableHeader column="exitDate" className="whitespace-nowrap">
                  Exit Date
                </SortableHeader>
              )}
              {(isClosedTab || hasPartiallyClosedTrades) && (
                <SortableHeader
                  column="totalProfit"
                  className="whitespace-nowrap"
                >
                  P/L
                </SortableHeader>
              )}
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.map((trade) => (
              <TableRow
                key={trade.id || trade._id}
                className={`
                  hover:bg-muted/20 transition-colors
                  ${trade.status === "PARTIALLY_CLOSED" ? "bg-amber-100/80 dark:bg-yellow-400/10" : ""}
                  ${trade.status === "CLOSED" ? "bg-slate-100/80 dark:bg-gray-400/10" : ""}
                  ${trade.status === "OPEN" ? "bg-slate-100/80 dark:bg-gray-400/10" : ""}
                `}
              >
                {isClosedTab && (
                  <TableCell className="whitespace-nowrap">
                    {trade.totalProfit !== undefined && (
                      <span
                        className={`
                        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          trade.totalProfit > 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : trade.totalProfit < 0
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                        }
                      `}
                      >
                        {trade.totalProfit > 0 ? (
                          <span>
                            <span className="text-green-600 dark:text-green-400">
                              ✓
                            </span>{" "}
                            Win
                          </span>
                        ) : trade.totalProfit < 0 ? (
                          <span>
                            <span className="text-red-600 dark:text-red-400">
                              ✗
                            </span>{" "}
                            Loss
                          </span>
                        ) : (
                          "Break Even"
                        )}
                      </span>
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">
                  {trade.entryDate
                    ? new Date(
                        trade.entryDate.split("T")[0] + "T00:00:00",
                      ).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.symbol}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.action
                    ? trade.action.charAt(0).toUpperCase() +
                      trade.action.slice(1)
                    : "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.quantity}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.price !== undefined
                    ? `$${trade.price.toFixed(2)}`
                    : "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.type.charAt(0).toUpperCase() + trade.type.slice(1)}{" "}
                  {trade.optionType}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.status === "CLOSED" ? (
                    <Input
                      type="text"
                      defaultValue={trade.strategy}
                      onBlur={(e) =>
                        handleStrategyUpdate(trade, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                          e.preventDefault();
                        }
                      }}
                      className="h-8 w-32 px-2 py-1 text-sm border-0 bg-transparent hover:bg-muted/50 focus:border focus:bg-background focus:border-input"
                      placeholder="Enter strategy"
                    />
                  ) : (
                    trade.strategy
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {trade.status}
                </TableCell>
                {hasPartiallyClosedTrades && (
                  <TableCell className="whitespace-nowrap">
                    {trade.status === "PARTIALLY_CLOSED" ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 dark:bg-yellow-400/20 text-yellow-700 dark:text-yellow-300">
                        {trade.remainingQuantity}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                {isClosedTab && (
                  <TableCell className="whitespace-nowrap">
                    {trade.exits && trade.exits.length > 0
                      ? `$${trade.exits[trade.exits.length - 1].exitPrice.toFixed(2)}`
                      : "-"}
                  </TableCell>
                )}
                {isClosedTab && (
                  <TableCell className="whitespace-nowrap">
                    {trade.exits && trade.exits.length > 0
                      ? new Date(
                          trade.exits[trade.exits.length - 1].exitDate.split(
                            "T",
                          )[0] + "T00:00:00",
                        ).toLocaleDateString()
                      : "-"}
                  </TableCell>
                )}
                {(isClosedTab || hasPartiallyClosedTrades) && (
                  <TableCell className="whitespace-nowrap">
                    {trade.status === "PARTIALLY_CLOSED" ||
                    trade.status === "CLOSED" ? (
                      <span
                        className={`
                        ${
                          trade.totalProfit && trade.totalProfit > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                        font-medium
                      `}
                      >
                        {trade.totalProfit?.toFixed(2)}
                        <br />
                        <span className="text-sm">
                          {trade.totalProfitPercentage !== undefined &&
                          trade.totalProfitPercentage !== null
                            ? `(${trade.totalProfitPercentage > 0 ? "+" : ""}${trade.totalProfitPercentage.toFixed(2)}%)`
                            : ""}
                        </span>
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">
                  <div className="space-x-2">
                    {(trade.status === "OPEN" ||
                      trade.status === "PARTIALLY_CLOSED") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(trade)}
                          className="hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExit(trade)}
                          className="hover:bg-green-500/10 dark:hover:bg-green-400/10"
                        >
                          Exit
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this trade?",
                          )
                        ) {
                          axiosInstance
                            .delete(`/api/trades/${trade.id}`)
                            .then(() => {
                              toast({
                                title: "Success",
                                description: "Trade deleted successfully",
                              });
                              onFetchTrades();
                            })
                            .catch((error) => {
                              console.error("Error deleting trade:", error);
                              toast({
                                title: "Error",
                                description: "Failed to delete trade",
                                variant: "destructive",
                              });
                            });
                        }
                      }}
                      className="hover:bg-red-500/10 dark:hover:bg-red-400/10"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, trades.length)} of{" "}
            {trades.length}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronUpIcon className="h-4 w-4 rotate-[-90deg]" />
              <ChevronUpIcon className="h-4 w-4 rotate-[-90deg] -ml-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronUpIcon className="h-4 w-4 rotate-[-90deg]" />
            </Button>

            <div className="flex items-center gap-1">
              {generatePaginationRange(currentPage, totalPages).map(
                (page, idx) =>
                  page === "..." ? (
                    <span key={`dot-${idx}`} className="px-2">
                      {page}
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        typeof page === "number" && setCurrentPage(page)
                      }
                      className={`h-8 w-8 p-0 ${currentPage === page ? "pointer-events-none" : ""}`}
                    >
                      {page}
                    </Button>
                  ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronDownIcon className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronDownIcon className="h-4 w-4 rotate-90" />
              <ChevronDownIcon className="h-4 w-4 rotate-90 -ml-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
