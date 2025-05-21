package com.tradepro.service;

import com.tradepro.dto.CsvTradeRecord;
import com.tradepro.dto.BrokerTradeRecord;
import com.tradepro.model.Exit;
import com.tradepro.model.Trade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.tradepro.exception.CsvImportException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CsvImportService {
    private static final Logger logger = LoggerFactory.getLogger(CsvImportService.class);

    @Autowired
    private TradeService tradeService;

    public List<Trade> processCsvRecords(List<CsvTradeRecord> records, String userId) {
        if (records == null || records.isEmpty()) {
            throw new CsvImportException("No records found in the CSV file. Please check the file and try again.");
        }

        try {
            logger.info("Starting to process {} CSV records", records.size());
            Map<String, Trade> openTradesMap = new HashMap<>();
            List<Trade> processedTrades = new ArrayList<>();

            // First pass: Process all records and identify open trades
            for (CsvTradeRecord record : records) {
                logger.debug("Processing record: {}", record);
                if (isOpeningTransaction(record.getAction())) {
                    Trade trade = createTradeFromCsvRecord(record, userId);
                    String tradeKey = generateTradeKey(record);
                    logger.debug("Created opening trade with key: {}", tradeKey);
                    openTradesMap.put(tradeKey, trade);
                }
            }

            // Second pass: Process closing transactions and match with open trades
            for (CsvTradeRecord record : records) {
                if (isClosingTransaction(record.getAction())) {
                    String tradeKey = generateTradeKey(record);
                    Trade openTrade = openTradesMap.get(tradeKey);
                    
                    if (openTrade != null) {
                        updateTradeWithClosingInfo(openTrade, record);
                        processedTrades.add(openTrade);
                        openTradesMap.remove(tradeKey);
                        logger.debug("Processed closing trade for key: {}", tradeKey);
                    } else {
                        logger.warn("No matching open trade found for closing transaction: {}", tradeKey);
                    }
                }
            }

            // Add remaining open trades to processed trades
            processedTrades.addAll(openTradesMap.values());
            logger.info("Completed processing. Total processed trades: {}", processedTrades.size());

            return processedTrades;
        } catch (Exception e) {
            logger.error("Failed to process CSV records: {}", e.getMessage());
            throw new CsvImportException("Failed to process the CSV file. Please ensure the file format is correct.");
        }
    }

    private String generateTradeKey(CsvTradeRecord record) {
        if (record == null || record.getSymbol() == null) {
            throw new CsvImportException("Invalid record or symbol is missing in CSV data.");
        }
        
        // For option trades (e.g., -SPY241115P575)
        if (record.getSymbol().matches("^-?\\w+\\d{6}[CP]\\d+$")) {
            return record.getSymbol();
        }
        return record.getSymbol() + "_stock";
    }

    private boolean isOpeningTransaction(String action) {
        if (action == null || action.trim().isEmpty()) {
            throw new CsvImportException("Transaction action is required.");
        }
        return action.equals("BUY") || action.equals("SELL");
    }

    private boolean isClosingTransaction(String action) {
        if (action == null || action.trim().isEmpty()) {
            throw new CsvImportException("Transaction action is required.");
        }
        return action.equals("BUY") || action.equals("SELL");
    }

    private Trade createTradeFromCsvRecord(CsvTradeRecord record, String userId) {
        if (record == null) {
            throw new CsvImportException("Invalid record found in CSV file.");
        }
        if (userId == null || userId.trim().isEmpty()) {
            throw new CsvImportException("User ID is required.");
        }
        if (record.getSymbol() == null || record.getSymbol().trim().isEmpty()) {
            throw new CsvImportException("Symbol is required in CSV record.");
        }
        if (record.getDescription() == null) {
            throw new CsvImportException("Description is required in CSV record.");
        }
        if (record.getSettlementDate() == null) {
            throw new CsvImportException("Settlement date is required in CSV record.");
        }

        try {
            logger.debug("Creating trade from record: {}", record);
            Trade trade = new Trade();
            trade.setUserId(userId);
            
            // Extract base symbol (e.g., SPY from SPY241115P575)
            String baseSymbol = record.getSymbol().replaceFirst("^-", "").replaceAll("\\d.*$", "");
            trade.setSymbol(baseSymbol);
            
            trade.setQuantity(Math.abs(record.getQuantity()));
            trade.setPrice(record.getPrice());
            trade.setEntryDate(parseDate(record.getSettlementDate()));
            trade.setStatus("CLOSED");
            trade.setType("option"); // Since all records are options
            
            // Set action based on description
            if (record.getDescription().contains("CALL")) {
                trade.setOptionType("CALL");
                trade.setAction("BUY");
            } else if (record.getDescription().contains("PUT")) {
                trade.setOptionType("PUT");
                trade.setAction("SELL");
            }

            // Leave strategy empty but set a metadata field for tracking CSV imports
            trade.setStrategy("");
            trade.setNotes("Imported from CSV"); // Using notes field to track import source

            // Create exit record since these are closed trades
            Exit exit = new Exit();
            exit.setExitDate(parseDate(record.getSettlementDate()));
            exit.setExitPrice(record.getPrice());
            exit.setExitQuantity(record.getQuantity());
            exit.setProfit(record.getAmount());

            List<Exit> exits = new ArrayList<>();
            exits.add(exit);
            trade.setExits(exits);
            trade.setTotalProfit(record.getAmount());

            logger.debug("Created trade: {}", trade);
            return trade;
        } catch (Exception e) {
            logger.error("Error creating trade from record: {}", e.getMessage());
            throw new CsvImportException("Failed to create trade from CSV record. Please check the data format.");
        }
    }

    private void updateTradeWithClosingInfo(Trade trade, CsvTradeRecord closingRecord) {
        if (trade == null) {
            throw new CsvImportException("Trade object cannot be null.");
        }
        if (closingRecord == null) {
            throw new CsvImportException("Closing record cannot be null.");
        }
        if (closingRecord.getSettlementDate() == null) {
            throw new CsvImportException("Settlement date is required for closing record.");
        }
        if (closingRecord.getPrice() == null) {
            throw new CsvImportException("Price is required for closing record.");
        }

        try {
            Exit exit = new Exit();
            exit.setExitDate(parseDate(closingRecord.getSettlementDate()));
            exit.setExitPrice(closingRecord.getPrice());
            exit.setExitQuantity(Math.abs(closingRecord.getQuantity()));
            
            // Calculate profit based on the amount field from CSV
            double profit = closingRecord.getAmount();
            exit.setProfit(profit);
            
            if (trade.getExits() == null) {
                trade.setExits(new ArrayList<>());
            }
            trade.getExits().add(exit);
            
            // Update trade status
            trade.setStatus("CLOSED");
            trade.setTotalProfit(profit);

            logger.debug("Updated trade with exit info: {}", trade);
        } catch (Exception e) {
            logger.error("Error updating trade with closing info: {}", e.getMessage());
            throw new CsvImportException("Failed to update trade with closing information. Please verify the data.");
        }
    }

    private String parseDate(String dateStr) {
        try {
            if (dateStr == null || dateStr.trim().isEmpty()) {
                throw new CsvImportException("Date field is required but was empty.");
            }
            // First try yyyy-MM-dd format
            try {
                LocalDate date = LocalDate.parse(dateStr.trim());
                return date.toString() + "T00:00:00.000Z";
            } catch (Exception e) {
                // If that fails, try MM/dd/yyyy format
                DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                LocalDate date = LocalDate.parse(dateStr.trim(), inputFormatter);
                return date.toString() + "T00:00:00.000Z";
            }
        } catch (Exception e) {
            logger.error("Error parsing date: '{}', Error: {}", dateStr, e.getMessage());
            throw new CsvImportException("Invalid date format. Please use YYYY-MM-DD format.");
        }
    }

    public List<BrokerTradeRecord> detectAndParseBrokerFormat(String csvContent) {
        if (csvContent == null || csvContent.trim().isEmpty()) {
            throw new CsvImportException("CSV content is empty");
        }

        // Split content into lines and get first line
        String[] lines = csvContent.split("\n");
        if (lines.length == 0) {
            throw new CsvImportException("No lines found in CSV");
        }

        // Detect delimiter and log raw first line for debugging
        String firstLine = lines[0];
        logger.info("Raw first line: {}", firstLine);

        // Try both delimiters
        String delimiter;
        if (firstLine.contains("\t")) {
            delimiter = "\t";
            logger.info("Detected TAB delimiter");
        } else if (firstLine.contains(",")) {
            delimiter = ",";
            logger.info("Detected COMMA delimiter");
        } else {
            throw new CsvImportException("Could not detect delimiter in CSV");
        }

        // Split and clean headers
        String[] headers = firstLine.split(delimiter);
        // Clean and normalize headers
        String[] cleanHeaders = new String[headers.length];
        for (int i = 0; i < headers.length; i++) {
            cleanHeaders[i] = headers[i]
                .trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", ""); // Remove special characters
        }

        logger.info("Cleaned headers: {}", String.join(", ", cleanHeaders));

        // Check for Fidelity format
        if (arrayContainsAny(cleanHeaders, "run", "date", "rundate") &&
            arrayContainsAny(cleanHeaders, "action", "type") &&
            arrayContainsAny(cleanHeaders, "symbol", "security")) {
            logger.info("Detected Fidelity format");
            return parseFidelityFormat(csvContent);
        } 
        // Check for Robinhood format - Updated to match actual headers
        else if (arrayContainsAny(cleanHeaders, "activity date") &&
                 arrayContainsAny(cleanHeaders, "instrument") &&
                 arrayContainsAny(cleanHeaders, "trans code") &&
                 arrayContainsAny(cleanHeaders, "quantity", "amount")) {
            logger.info("Detected Robinhood format");
            return parseRobinhoodFormat(csvContent);
        }

        // Log all attempted matches for debugging
        logger.error("No matching format found. Headers found: {}", String.join(", ", cleanHeaders));
        logger.error("Expected Fidelity headers: run date/action/symbol");
        logger.error("Expected Robinhood headers: activity date/instrument/trans code/quantity");
        
        throw new CsvImportException("Unsupported broker format. Please ensure your CSV contains the required headers.");
    }

    private boolean arrayContainsAny(String[] array, String... targets) {
        for (String str : array) {
            for (String target : targets) {
                if (str.contains(target)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean containsHeaders(String[] headers, String... expectedHeaders) {
        List<String> headerList = Arrays.asList(headers);
        logger.debug("Checking headers: {} against expected: {}", 
            String.join(", ", headerList), 
            String.join(", ", expectedHeaders));
        
        // More flexible header matching
        return Arrays.stream(expectedHeaders)
                    .allMatch(expected -> 
                        headerList.stream()
                                .anyMatch(header -> {
                                    // Clean up header for comparison
                                    String cleanHeader = header.trim()
                                        .replaceAll("[^a-zA-Z0-9]", "")
                                        .toLowerCase();
                                    String cleanExpected = expected.trim()
                                        .replaceAll("[^a-zA-Z0-9]", "")
                                        .toLowerCase();
                                    return cleanHeader.contains(cleanExpected);
                                }));
    }

    private List<BrokerTradeRecord> parseGenericFormat(String csvContent) {
        List<BrokerTradeRecord> records = new ArrayList<>();
        String[] lines = csvContent.split("\n");
        
        // Skip header
        for (int i = 1; i < lines.length; i++) {
            if (lines[i].trim().isEmpty()) continue;
            
            String[] fields = lines[i].split(",");
            try {
                BrokerTradeRecord record = new BrokerTradeRecord();
                record.setSymbol(fields[0].trim());
                record.setTradeDate(LocalDateTime.parse(fields[1].trim()));
                record.setAction(fields[2].trim().toUpperCase());
                record.setOpenClose(fields[3].trim().toUpperCase());
                record.setQuantity(Double.parseDouble(fields[4].trim()));
                record.setPrice(Double.parseDouble(fields[5].trim()));
                record.setType(fields[6].trim().toUpperCase());
                
                // Optional fields
                if (fields.length > 7) record.setOptionType(fields[7].trim().toUpperCase());
                if (fields.length > 8) record.setStrikePrice(Double.parseDouble(fields[8].trim()));
                if (fields.length > 9) record.setExpirationDate(LocalDateTime.parse(fields[9].trim()));
                
                record.setBroker("GENERIC");
                records.add(record);
            } catch (Exception e) {
                logger.error("Error parsing generic format line {}: {}", i, e.getMessage());
                throw new CsvImportException("Error parsing line " + i + ": " + e.getMessage());
            }
        }
        return records;
    }

      private List<BrokerTradeRecord> parseRobinhoodFormat(String csvContent) {
        List<BrokerTradeRecord> records = new ArrayList<>();
        String[] lines = csvContent.split("\n");
        
        // Validate Robinhood headers
        String[] headers = parseCsvLine(lines[0]);
        if (!containsHeaders(headers, "activity date", "instrument", "trans code", "quantity", "price")) {
            throw new CsvImportException("Invalid Robinhood CSV format");
        }
        
        // Skip header
        for (int i = 1; i < lines.length; i++) {
            if (lines[i].trim().isEmpty()) continue;
            
            try {
                String[] fields = parseCsvLine(lines[i]);
                
                // Skip if we don't have enough fields
                if (fields.length < 9) {
                    logger.debug("Skipping line {} - insufficient fields: {}", i, lines[i]);
                    continue;
                }

                // Skip non-trade transactions
                String transCode = fields[5].trim().toUpperCase();
                if (!isTradeTransaction(transCode)) {
                    continue;
                }

                BrokerTradeRecord record = new BrokerTradeRecord();
                
                record.setTradeDate(parseLocalDateTime(fields[0].trim())); // Activity Date
                record.setSymbol(fields[3].trim()); // Instrument
                
                // Map transaction codes
                String transactionCode = fields[5].trim().toUpperCase();
                if (transactionCode.equals("BTO")) {
                    record.setAction("BUY");
                    record.setOpenClose("OPEN");
                } else if (transactionCode.equals("STC")) {
                    record.setAction("SELL");
                    record.setOpenClose("CLOSE");
                }
                
                record.setQuantity(Double.parseDouble(fields[6].trim())); // Quantity
                record.setPrice(Double.parseDouble(fields[7].trim().replace("$", "").replace(",", "").trim())); // Price
                record.setAmount(Double.parseDouble(fields[8].trim().replace("$", "").replace(",", "").replace("(", "-").replace(")", "").trim())); // Amount
                
                // Parse option details from description
                String description = fields[4].trim();
                if (description.contains("Call") || description.contains("Put")) {
                    record.setType("OPTION");
                    parseOptionDetails(description, record);
                } else {
                    record.setType("STOCK");
                }
                
                record.setBroker("ROBINHOOD");
                records.add(record);
            } catch (Exception e) {
                logger.error("Error parsing Robinhood format line {}: {}", i, e.getMessage());
                throw new CsvImportException("Error parsing line " + i + ": " + e.getMessage());
            }
        }
        return records;
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                // If we see a quote, toggle inQuotes flag
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                // If we see a comma and we're not in quotes, add the token
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                // Otherwise, append the character
                sb.append(c);
            }
        }
        
        // Add the last token
        tokens.add(sb.toString().trim());
        
        // Remove quotes from all tokens
        return tokens.stream()
            .map(token -> token.replaceAll("^\"|\"$", ""))
            .toArray(String[]::new);
    }

    private boolean isTradeTransaction(String transCode) {
        return transCode.equals("BTO") || transCode.equals("STC") || 
               transCode.equals("Buy") || transCode.equals("Sell");
    }

    private List<BrokerTradeRecord> parseFidelityFormat(String csvContent) {
        List<BrokerTradeRecord> records = new ArrayList<>();
        String[] lines = csvContent.split("\n");
        
        try {
            // Detect delimiter from first line
            String delimiter = lines[0].contains("\t") ? "\t" : ",";
            logger.info("Using delimiter: {}", delimiter.equals("\t") ? "TAB" : "COMMA");
            
            // Get header indices
            String[] headers = splitCsvLine(lines[0], delimiter);
            Map<String, Integer> headerIndices = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                String cleanHeader = headers[i].trim().toLowerCase()
                    .replace("($)", "")
                    .replace("$", "")
                    .trim();
                headerIndices.put(cleanHeader, i);
            }
            
            logger.info("Header mapping: {}", headerIndices);
            
            // Skip header
            for (int i = 1; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty()) continue;
                
                try {
                    // Split line handling quoted values
                    String[] fields = splitCsvLine(line, delimiter);
                    
                    // Validate field count
                    if (fields.length < headerIndices.size()) {
                        logger.warn("Skipping line {} - insufficient fields: {}", i, line);
                        continue;
                    }
                    
                    // Skip non-trade transactions
                    String action = fields[headerIndices.get("action")].trim().toUpperCase();
                    String description = fields[headerIndices.get("description")].trim().toUpperCase();
                    
                    if (shouldSkipTransaction(action, description)) {
                        logger.debug("Skipping non-trade transaction: {}", action);
                        continue;
                    }

                    BrokerTradeRecord record = new BrokerTradeRecord();
                    
                    try {
                        // Map fields using header indices with error handling
                        record.setSymbol(getFieldValue(fields, headerIndices, "symbol"));
                        record.setTradeDate(parseDateTime(getFieldValue(fields, headerIndices, "run date")));
                        record.setPrice(parseDouble(getFieldValue(fields, headerIndices, "price")));
                        record.setQuantity(parseDouble(getFieldValue(fields, headerIndices, "quantity")));
                        record.setCommission(parseDoubleOrDefault(getFieldValue(fields, headerIndices, "commission"), 0.0));
                        record.setFees(parseDoubleOrDefault(getFieldValue(fields, headerIndices, "fees"), 0.0));
                        record.setAmount(parseDoubleOrDefault(getFieldValue(fields, headerIndices, "amount"), 0.0));

                        // Set action (BUY/SELL) based on opening/closing transaction
                        if (action.contains("OPENING")) {
                            // For opening transactions, use the actual action (BUY for BOUGHT)
                            if (action.contains("BOUGHT") || action.contains("BUY")) {
                                record.setAction("BUY");
                            } else if (action.contains("SOLD") || action.contains("SELL")) {
                                record.setAction("SELL");  // This will be for SELL TO OPEN
                            }
                        } else {
                            // For closing transactions, use the opposite of the action
                            // If it's SOLD TO CLOSE, it means original position was BUY
                            // If it's BOUGHT TO CLOSE, it means original position was SELL
                            if (action.contains("BOUGHT") || action.contains("BUY")) {
                                record.setAction("SELL");  // Original position was SELL
                            } else if (action.contains("SOLD") || action.contains("SELL")) {
                                record.setAction("BUY");   // Original position was BUY
                            }
                        }

                        // Also update the openClose field
                        record.setOpenClose(action.contains("OPENING") ? "OPEN" : "CLOSE");

                        // Handle options
                        if (description.contains("CALL") || description.contains("PUT")) {
                            record.setType("OPTION");
                            record.setOptionType(description.contains("CALL") ? "CALL" : "PUT");
                            parseOptionDetails(description, record);
                        } else {
                            record.setType("STOCK");
                        }

                        record.setBroker("FIDELITY");
                        records.add(record);
                        logger.debug("Successfully parsed record: {}", record.getSymbol());
                        
                    } catch (Exception e) {
                        logger.warn("Error parsing fields for line {}: {}", i, e.getMessage());
                        continue; // Skip this record but continue processing others
                    }
                    
                } catch (Exception e) {
                    logger.error("Error parsing line {}: {}", i, e.getMessage());
                    throw new CsvImportException("Error parsing line " + i + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.error("Error parsing Fidelity format: {}", e.getMessage());
            throw new CsvImportException("Error parsing Fidelity format: " + e.getMessage());
        }
        
        return records;
    }

    // Helper methods for safer field access and parsing
    private String getFieldValue(String[] fields, Map<String, Integer> headerIndices, String headerName) {
        Integer index = headerIndices.get(headerName);
        if (index == null || index >= fields.length) {
            return "";
        }
        return fields[index].trim();
    }

    private double parseDoubleOrDefault(String value, double defaultValue) {
        try {
            if (value == null || value.trim().isEmpty()) return defaultValue;
            return parseDouble(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private void parseOptionDetails(String description, BrokerTradeRecord record) {
        try {
            // Example: "PUT (SPY) SPDR S&P500 ETF DEC 20 24 $600 (100 SHS)"
            // or: "CALL (CHWY) CHEWY INC CL A JAN 17 25 $32.5 (100 SHS)"
            
            // Parse option type
            if (description.toUpperCase().contains("PUT")) {
                record.setOptionType("PUT");
            } else if (description.toUpperCase().contains("CALL")) {
                record.setOptionType("CALL");
            }

            // Parse strike price - looking for pattern $XX.XX or $XX
            Pattern pricePattern = Pattern.compile("\\$\\s*(\\d+(?:\\.\\d+)?)");
            Matcher priceMatcher = pricePattern.matcher(description);
            if (priceMatcher.find()) {
                record.setStrikePrice(Double.parseDouble(priceMatcher.group(1)));
            }

            // Parse expiration date - handle both formats:
            // "DEC 20 24" or "12/20/24" or "12/20/2024"
            String[] words = description.split("\\s+");
            for (int i = 0; i < words.length - 2; i++) {
                // Try to parse as MMM DD YY format
                try {
                    String monthStr = words[i].toUpperCase();
                    String dayStr = words[i + 1];
                    String yearStr = words[i + 2];
                    
                    // Validate month
                    if (monthStr.matches("JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC")) {
                        // Convert month to number
                        int month = Arrays.asList("JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
                                                "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
                                        .indexOf(monthStr) + 1;
                        
                        // Parse day and year
                        int day = Integer.parseInt(dayStr);
                        int year = Integer.parseInt(yearStr);
                        if (year < 100) year += 2000; // Convert 2-digit year to 4-digit
                        
                        // Create LocalDateTime
                        record.setExpirationDate(
                            LocalDateTime.of(year, month, day, 0, 0)
                        );
                        break;
                    }
                } catch (Exception e) {
                    // Continue to next word if this combination fails
                    continue;
                }
            }

            // If expiration date wasn't set, try alternate format (MM/DD/YY)
            if (record.getExpirationDate() == null) {
                Pattern datePattern = Pattern.compile("(\\d{1,2})/(\\d{1,2})/(\\d{2,4})");
                Matcher dateMatcher = datePattern.matcher(description);
                if (dateMatcher.find()) {
                    int month = Integer.parseInt(dateMatcher.group(1));
                    int day = Integer.parseInt(dateMatcher.group(2));
                    int year = Integer.parseInt(dateMatcher.group(3));
                    if (year < 100) year += 2000;
                    
                    record.setExpirationDate(
                        LocalDateTime.of(year, month, day, 0, 0)
                    );
                }
            }

            logger.debug("Parsed option details - Type: {}, Strike: {}, Expiry: {}", 
                record.getOptionType(), record.getStrikePrice(), record.getExpirationDate());

        } catch (Exception e) {
            logger.warn("Error parsing option details from description: {} - Error: {}", 
                description, e.getMessage());
        }
    }

    private double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) return 0.0;
        return Double.parseDouble(value.replace("$", "")
                                     .replace(",", "")
                                     .replace("(", "-")
                                     .replace(")", "")
                                     .trim());
    }

    private LocalDateTime parseOptionExpirationDate(String dateStr) {
        try {
            // Define patterns as strings
            String[] patterns = {
                "MMM dd yyyy",
                "MM/dd/yyyy",
                "MM/dd/yy"
            };

            for (String pattern : patterns) {
                try {
                    // Add time to the date string
                    String dateTimeStr = dateStr + " 00:00";
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern + " HH:mm");
                    return LocalDateTime.parse(dateTimeStr, formatter);
                } catch (Exception e) {
                    continue;
                }
            }
            throw new CsvImportException("Unable to parse date: " + dateStr);
        } catch (Exception e) {
            throw new CsvImportException("Invalid date format: " + dateStr);
        }
    }

    private String[] splitCsvLine(String line, String delimiter) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder field = new StringBuilder();
        
        // Handle empty or null lines
        if (line == null || line.trim().isEmpty()) {
            return new String[0];
        }
        
        char[] chars = line.toCharArray();
        for (int i = 0; i < chars.length; i++) {
            char c = chars[i];
            
            if (c == '"') {
                // Handle escaped quotes (double quotes)
                if (i + 1 < chars.length && chars[i + 1] == '"') {
                    field.append('"');
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == delimiter.charAt(0) && !inQuotes) {
                result.add(field.toString().trim());
                field = new StringBuilder();
            } else {
                field.append(c);
            }
        }
        
        // Add the last field
        result.add(field.toString().trim());
        
        // Validate field count based on header
        if (result.isEmpty()) {
            return new String[0];
        }
        
        return result.toArray(new String[0]);
    }

    private LocalDateTime parseDateTime(String dateStr) {
        try {
            // Remove any quotes and trim
            dateStr = dateStr.replace("\"", "").trim();
            
            // Define date patterns
            String[] patterns = {
                "MM/dd/yyyy",
                "yyyy-MM-dd",
                "M/d/yyyy"
            };
            
            // Try each pattern
            for (String pattern : patterns) {
                try {
                    // Add time to the date string
                    String dateTimeStr = dateStr + " 00:00";
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern + " HH:mm");
                    return LocalDateTime.parse(dateTimeStr, formatter);
                } catch (Exception e) {
                    continue;
                }
            }
            
            throw new CsvImportException("Unable to parse date: " + dateStr);
        } catch (Exception e) {
            throw new CsvImportException("Invalid date format: " + dateStr);
        }
    }

    private boolean shouldSkipTransaction(String action, String description) {
        // First check if it's an expired option
        if (description != null && 
            (description.toUpperCase().contains("EXPIRED CALL") || 
             description.toUpperCase().contains("EXPIRED PUT"))) {
            // Don't skip expired options - we want to process them as closing transactions
            logger.info("Found expired option: {}", description);
            return false;
        }

        // Original skip logic for other transactions
        List<String> skipActions = Arrays.asList(
            "ELECTRONIC",
            "TRANSFER",
            "DIVIDEND",
            "INTEREST",
            "JOURNAL",
            "DEPOSIT",
            "WITHDRAWAL",
            "FEE",
            "WIRE",
            "CONTRIBUTION",
            "DISTRIBUTION"
        );

        List<String> skipDescriptions = Arrays.asList(
            "ELECTRONIC FUNDS TRANSFER",
            "CASH MANAGEMENT",
            "INTEREST EARNED",
            "DIVIDEND RECEIVED",
            "CASH CONTRIBUTION",
            "CASH DISBURSEMENT",
            "WIRE TRANSFER",
            "ACH TRANSFER",
            "MARGIN INTEREST",
            "REORGANIZATION"
        );

        return skipActions.stream().anyMatch(action::contains) ||
               skipDescriptions.stream().anyMatch(description::contains) ||
               !action.contains("BOUGHT") && !action.contains("SOLD") && 
               !action.contains("BUY") && !action.contains("SELL") &&
               !description.contains("EXPIRED"); // Added check for expired options
    }

    public List<Trade> processBrokerRecords(List<BrokerTradeRecord> records, String userId) {
        Map<String, Trade> openTradesMap = new HashMap<>();
        List<Trade> processedTrades = new ArrayList<>();

        // First, sort records by date to ensure proper order
        records.sort((a, b) -> a.getTradeDate().compareTo(b.getTradeDate()));
        logger.info("Processing {} records after sorting by date", records.size());

        // Debug log all records with "EXPIRED" in description
        records.forEach(r -> {
            if (r.getDescription() != null && r.getDescription().toUpperCase().contains("EXPIRED")) {
                logger.info("Found potential expired option record: {}", r.getDescription());
            }
        });

        // Process opening transactions
        for (BrokerTradeRecord record : records) {
            if (record.getOpenClose().equals("OPEN")) {
                String tradeKey = generateTradeKeyFromBrokerRecord(record);
                
                logger.info("Found potential opening trade - Symbol: {}, Action: {}, Quantity: {}, Date: {}, Key: {}", 
                    record.getSymbol(), record.getAction(), record.getQuantity(), record.getTradeDate(), tradeKey);
                
                Trade existingTrade = openTradesMap.get(tradeKey);
                if (existingTrade != null) {
                    existingTrade.addToQuantity(record.getQuantity().intValue());
                } else {
                    Trade trade = createTradeFromBrokerRecord(record, userId);
                    trade.setRemainingQuantity(trade.getQuantity());
                    openTradesMap.put(tradeKey, trade);
                }
            }
        }

        // Process closing and expired transactions
        for (BrokerTradeRecord record : records) {
            // Debug log the record description
            logger.debug("Processing record with description: {}", record.getDescription());
            
            // Check for expired options first
            boolean isExpired = record.getDescription() != null && 
                record.getDescription().toUpperCase().startsWith("EXPIRED");
            
            if (isExpired) {
                logger.info("Found expired option record: {}", record.getDescription());
            }

            if (record.getOpenClose().equals("CLOSE") || isExpired) {
                String tradeKey = generateTradeKeyFromBrokerRecord(record);
                Trade openTrade = openTradesMap.get(tradeKey);
                
                logger.info("Processing potential closing/expired trade - Symbol: {}, Action: {}, Quantity: {}, Date: {}, Key: {}, IsExpired: {}", 
                    record.getSymbol(), record.getAction(), record.getQuantity(), record.getTradeDate(), tradeKey, isExpired);
                
                if (openTrade != null) {
                    // For expired options, store the description in trade notes before updating
                    if (isExpired) {
                        openTrade.setNotes(record.getDescription());
                    }
                    
                    updateTradeWithClosingInfo(openTrade, record);
                    
                    if (isExpired || openTrade.getRemainingQuantity() == 0) {
                        openTrade.setStatus("CLOSED");
                        openTrade.setRemainingQuantity(0);
                        openTradesMap.remove(tradeKey);
                        processedTrades.add(openTrade);
                        logger.info("{} processed - Marked as closed: {}", 
                            isExpired ? "Expired option" : "Trade", tradeKey);
                    }
                }
            }
        }

        // Add remaining open trades
        logger.info("Processing remaining open trades - Count: {}", openTradesMap.size());
        processedTrades.addAll(openTradesMap.values());

        // Log summary
        logger.info("Processing complete - Total trades: {}", processedTrades.size());
        logger.info("Open trades: {}", 
            processedTrades.stream().filter(t -> "OPEN".equals(t.getStatus())).count());
        logger.info("Closed trades: {}", 
            processedTrades.stream().filter(t -> "CLOSED".equals(t.getStatus())).count());
        logger.info("Partially closed trades: {}", 
            processedTrades.stream().filter(t -> "PARTIALLY_CLOSED".equals(t.getStatus())).count());

        // Enhanced logging for expired options
        logger.info("---------------- EXPIRED OPTIONS SUMMARY ----------------");
        
        // Count expired options from records
        List<BrokerTradeRecord> expiredRecords = records.stream()
            .filter(r -> r.getDescription() != null && 
                        r.getDescription().toUpperCase().startsWith("EXPIRED") && 
                        r.getDescription().toUpperCase().contains(" AS OF "))
            .collect(Collectors.toList());
        
        logger.info("Total expired options found in records: {}", expiredRecords.size());

        logger.info("---------------- EXPIRED OPTIONS DETAILS ----------------");
        expiredRecords.forEach(r -> {
            logger.info("Raw expired record found:");
            logger.info("  Symbol: {}", r.getSymbol().replaceFirst("^-", ""));
            logger.info("  Description: {}", r.getDescription());
            logger.info("  Date: {}", r.getTradeDate());
            logger.info("  Strike Price: {}", r.getStrikePrice());
            logger.info("  Option Type: {}", r.getOptionType());
            logger.info("  Amount: ${}", String.format("%.2f", 
                Math.abs(r.getAmount() != null ? r.getAmount() : 0.0)));
        });

        logger.info("---------------- PROCESSED EXPIRED TRADES ----------------");
        // Log processed expired trades with more details
        processedTrades.stream()
            .filter(t -> t.getExits() != null && t.getExits().stream()
                .anyMatch(e -> e.getExitPrice() == 0.0 && isExpiredOption(t.getNotes())))
            .forEach(t -> logger.info("Processed expired trade - Symbol: {}, Strike: {}, Type: {}, Entry Date: {}, " +
                    "Expiry Date: {}, Entry Price: ${}, Loss: ${}, Status: {}, Description: {}", 
                t.getSymbol(),
                t.getStrikePrice(),
                t.getOptionType(),
                t.getEntryDate(),
                t.getExitDate(),
                String.format("%.2f", t.getPrice()),
                String.format("%.2f", Math.abs(t.getTotalProfit())),
                t.getStatus(),
                t.getNotes()));

        logger.info("---------------- END EXPIRED OPTIONS SUMMARY ----------------");

        // After processing all trades, check for expired options
        LocalDateTime currentDate = LocalDateTime.now();
        
        // Process remaining open trades and check for expired options
        logger.info("Checking for expired options in remaining open trades...");
        Iterator<Map.Entry<String, Trade>> iterator = openTradesMap.entrySet().iterator();
        
        while (iterator.hasNext()) {
            Map.Entry<String, Trade> entry = iterator.next();
            Trade trade = entry.getValue();
            
            if ("option".equalsIgnoreCase(trade.getType()) && trade.getExpirationDate() != null) {
                LocalDateTime expirationDate = LocalDateTime.parse(trade.getExpirationDate());
                
                if (currentDate.isAfter(expirationDate)) {
                    logger.info("Found expired option - Symbol: {}, Strike: {}, Type: {}, Expiration: {}", 
                        trade.getSymbol(), trade.getStrikePrice(), trade.getOptionType(), trade.getExpirationDate());
                    
                    // Create exit for expired option
                    Exit exit = new Exit();
                    exit.setExitDate(trade.getExpirationDate());
                    exit.setExitPrice(0.0); // Expired options are worthless
                    exit.setExitQuantity(trade.getRemainingQuantity());
                    
                    // Calculate 100% loss
                    double entryValue = trade.getPrice() * trade.getRemainingQuantity() * 100; // * 100 for options
                    double profit = -entryValue; // 100% loss
                    exit.setProfit(profit);
                    
                    // Update trade
                    if (trade.getExits() == null) {
                        trade.setExits(new ArrayList<>());
                    }
                    trade.getExits().add(exit);
                    trade.setStatus("CLOSED");
                    trade.setRemainingQuantity(0);
                    trade.setTotalProfit(trade.getExits().stream()
                        .mapToDouble(Exit::getProfit)
                        .sum());
                    trade.setExitDate(trade.getExpirationDate());
                    trade.setNotes("Option expired worthless on " + trade.getExpirationDate());
                    
                    // Move to processed trades
                    processedTrades.add(trade);
                    iterator.remove();
                    
                    logger.info("Processed expired option - Symbol: {}, Loss: ${}", 
                        trade.getSymbol(), Math.abs(profit));
                }
            }
        }

        // Add remaining non-expired open trades
        processedTrades.addAll(openTradesMap.values());

        // Log summary with expired options
        logger.info("---------------- TRADE SUMMARY WITH EXPIRED OPTIONS ----------------");
        logger.info("Total trades processed: {}", processedTrades.size());
        logger.info("Open trades: {}", 
            processedTrades.stream().filter(t -> "OPEN".equals(t.getStatus())).count());
        logger.info("Closed trades: {}", 
            processedTrades.stream().filter(t -> "CLOSED".equals(t.getStatus())).count());
        logger.info("Partially closed trades: {}", 
            processedTrades.stream().filter(t -> "PARTIALLY_CLOSED".equals(t.getStatus())).count());
        
        // Log expired options specifically
        logger.info("---------------- EXPIRED OPTIONS DETAILS ----------------");
        processedTrades.stream()
            .filter(t -> "option".equalsIgnoreCase(t.getType()) && 
                        "CLOSED".equals(t.getStatus()) &&
                        t.getExits().stream().anyMatch(e -> e.getExitPrice() == 0.0))
            .forEach(t -> logger.info("Expired Option - Symbol: {}, Strike: {}, Type: {}, " +
                    "Entry Date: {}, Expiry Date: {}, Entry Price: ${}, Loss: ${}", 
                t.getSymbol(),
                t.getStrikePrice(),
                t.getOptionType(),
                t.getEntryDate(),
                t.getExpirationDate(),
                String.format("%.2f", t.getPrice()),
                String.format("%.2f", Math.abs(t.getTotalProfit()))));

        return processedTrades;
    }

    private String generateTradeKeyFromBrokerRecord(BrokerTradeRecord record) {
        StringBuilder key = new StringBuilder();
        
        // Add base symbol
        String baseSymbol = standardizeSymbol(record.getSymbol(), record.getType());
        key.append(baseSymbol);
        
        logger.info("Generating trade key for Symbol: {}, Type: {}, Base Symbol: {}", 
            record.getSymbol(), record.getType(), baseSymbol);
        
        // Add standardized type
        key.append("_").append(record.getType().toUpperCase().trim());
        
        // For options, standardize all components
        if ("OPTION".equals(record.getType().toUpperCase().trim())) {
            String optionKey = key.append("_")
               .append(standardizeOptionType(record.getOptionType()))
               .append("_")
               .append(standardizeStrikePrice(record.getStrikePrice()))
               .append("_")
               .append(standardizeDate(record.getExpirationDate()))
               .toString();
            
            logger.info("Generated option trade key: {} for Symbol: {}, Strike: {}, Expiry: {}", 
                optionKey, record.getSymbol(), record.getStrikePrice(), record.getExpirationDate());
                
            return optionKey;
        }
        
        String finalKey = key.toString();
        logger.info("Generated trade key: {}", finalKey);
        return finalKey;
    }

    private String standardizeSymbol(String symbol, String type) {
        if (symbol == null) return "";
        
        // Remove any whitespace, leading dash and convert to uppercase
        String standardized = symbol.replaceAll("^-", "")  // Remove leading dash
                                   .replaceAll("\\s+", "") // Remove whitespace
                                   .toUpperCase();
        
        if ("OPTION".equals(type.toUpperCase())) {
            // Extract base symbol from option symbols like:
            // SPY241220P600 -> SPY
            // SPY 12/20/24 P 600 -> SPY
            // SPY_241220_P_600 -> SPY
            // -SPY241220P600 -> SPY
            return standardized.replaceAll("\\d.*$", "")
                             .replaceAll("[CP]\\d+$", "")
                             .replaceAll("_.*$", "");
        }
        
        return standardized;
    }

    private String standardizeOptionType(String optionType) {
        if (optionType == null) return "";
        String upper = optionType.toUpperCase().trim();
        if (upper.contains("CALL") || upper.equals("C")) return "CALL";
        if (upper.contains("PUT") || upper.equals("P")) return "PUT";
        return upper;
    }

    private String standardizeStrikePrice(Double strikePrice) {
        if (strikePrice == null) return "0.00";
        // Format to standard 2 decimal places
        return String.format("%.2f", strikePrice);
    }

    private String standardizeDate(LocalDateTime date) {
        if (date == null) return "";
        // Format to yyyyMMdd
        return date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    }

    private Trade createTradeFromBrokerRecord(BrokerTradeRecord record, String userId) {
        Trade trade = new Trade();
        trade.setUserId(userId);
        
        // Store the full symbol for matching purposes
        trade.setFullSymbol(record.getSymbol());
        // Extract and store the base symbol for display and calculations
        trade.setSymbol(extractBaseSymbol(record.getSymbol(), record.getType()));
        
        trade.setQuantity(record.getQuantity().intValue());
        trade.setPrice(record.getPrice());
        trade.setType(record.getType().toLowerCase());
        trade.setAction(record.getAction().toLowerCase());
        trade.setEntryDate(record.getTradeDate().toString());
        trade.setStatus("OPEN");
        
        if ("OPTION".equals(record.getType())) {
            trade.setOptionType(record.getOptionType().toLowerCase());
            trade.setStrikePrice(record.getStrikePrice());
            // Handle null expirationDate
            if (record.getExpirationDate() != null) {
                trade.setExpirationDate(record.getExpirationDate().toString());
            }
        }
        
        return trade;
    }

    private void updateTradeWithClosingInfo(Trade trade, BrokerTradeRecord record) {
        Exit exit = new Exit();
        exit.setExitDate(record.getTradeDate().toString());
        
        // Check if this is an expired option using the new pattern
        boolean isExpired = isExpiredOption(record.getDescription());
        
        if (isExpired) {
            // For expired options, set exit price to 0 since it's a 100% loss
            exit.setExitPrice(0.0);
            // Store the description in trade notes for reference
            trade.setNotes(record.getDescription());
            logger.info("Processing expired option for symbol: {} - Setting exit price to 0, Description: {}", 
                trade.getSymbol(), record.getDescription());
        } else {
            exit.setExitPrice(record.getPrice());
        }
        
        // Use absolute value for quantity
        int exitQuantity = Math.abs(record.getQuantity().intValue());
        exit.setExitQuantity(exitQuantity);
        
        // Calculate profit
        double entryValue = trade.getPrice() * exitQuantity;
        double exitValue = exit.getExitPrice() * exitQuantity;
        
        if ("option".equalsIgnoreCase(trade.getType())) {
            entryValue = entryValue * 100;
            exitValue = exitValue * 100;
        }
        
        // For expired options, the loss is the entire entry value
        double profit;
        if (isExpired) {
            profit = -entryValue; // 100% loss
            logger.info("Calculated 100% loss for expired option: {} - Loss amount: {}", 
                trade.getSymbol(), profit);
        } else {
            // Use existing profit calculation for non-expired options
            if (trade.getAction().equals("buy")) {
                profit = exitValue - entryValue;
            } else {
                profit = entryValue - exitValue;
            }
        }
        
        // Include commissions and fees if available
        if (record.getCommission() != null) profit -= record.getCommission();
        if (record.getFees() != null) profit -= record.getFees();
        
        exit.setProfit(profit);
        
        // Calculate profit percentage for this exit
        double profitPercentage = (profit / Math.abs(entryValue)) * 100;
        exit.setProfitPercentage(profitPercentage);
        
        // Initialize exits list if null
        if (trade.getExits() == null) {
            trade.setExits(new ArrayList<>());
        }
        
        // Add exit to the trade
        trade.getExits().add(exit);
        
        // Update remaining quantity
        int newRemainingQuantity = trade.getRemainingQuantity() - exitQuantity;
        trade.setRemainingQuantity(Math.max(0, newRemainingQuantity));  // Ensure non-negative
        
        // Update trade status based on remaining quantity
        if (newRemainingQuantity == 0) {
            trade.setStatus("CLOSED");
            trade.setExitDate(exit.getExitDate());
        } else if (newRemainingQuantity > 0) {
            trade.setStatus("PARTIALLY_CLOSED");
            logger.info("Trade partially closed - Symbol: {}, Original Qty: {}, Exit Qty: {}, Remaining: {}", 
                trade.getSymbol(), trade.getQuantity(), exitQuantity, newRemainingQuantity);
        }
        
        // Calculate total profit across all exits
        double totalProfit = trade.getExits().stream()
            .mapToDouble(Exit::getProfit)
            .sum();
        trade.setTotalProfit(totalProfit);
        
        // Calculate total profit percentage based on original quantity
        double totalEntryValue = trade.getPrice() * trade.getQuantity() * 
            (trade.getType().equals("option") ? 100 : 1);
        trade.setTotalProfitPercentage((totalProfit / Math.abs(totalEntryValue)) * 100);
        
        logger.info("Updated trade with exit info - Symbol: {}, Status: {}, Exit Qty: {}, Remaining: {}, Profit: {}", 
            trade.getSymbol(), trade.getStatus(), exitQuantity, trade.getRemainingQuantity(), profit);
    }

    private boolean verifyTradeMatch(Trade openTrade, BrokerTradeRecord closingRecord) {
        logger.info("Verifying trade match:");
        logger.info("Open Trade - Symbol: {}, Full Symbol: {}, Type: {}, Option Type: {}, Strike: {}, Expiry: {}", 
            openTrade.getSymbol(), openTrade.getFullSymbol(), openTrade.getType(), 
            openTrade.getOptionType(), openTrade.getStrikePrice(), openTrade.getExpirationDate());
        logger.info("Closing Record - Symbol: {}, Type: {}, Option Type: {}, Strike: {}, Expiry: {}", 
            closingRecord.getSymbol(), closingRecord.getType(), 
            closingRecord.getOptionType(), closingRecord.getStrikePrice(), closingRecord.getExpirationDate());

        // Match using the full symbol for exact matching
        boolean symbolMatch = openTrade.getFullSymbol().equalsIgnoreCase(closingRecord.getSymbol());
        boolean typeMatch = openTrade.getType().equalsIgnoreCase(closingRecord.getType());
        
        // For options, verify additional details
        boolean optionDetailsMatch = true;
        if ("OPTION".equalsIgnoreCase(openTrade.getType())) {
            optionDetailsMatch = openTrade.getOptionType().equalsIgnoreCase(closingRecord.getOptionType()) &&
                               openTrade.getStrikePrice() == closingRecord.getStrikePrice() &&
                               (openTrade.getExpirationDate() == null && closingRecord.getExpirationDate() == null ||
                                openTrade.getExpirationDate() != null && closingRecord.getExpirationDate() != null &&
                                openTrade.getExpirationDate().equals(closingRecord.getExpirationDate().toString()));
        }
        
        boolean matches = symbolMatch && typeMatch && optionDetailsMatch;
        
        logger.info("Match results - Symbol: {}, Type: {}, Option Details: {}, Final Match: {}", 
            symbolMatch, typeMatch, optionDetailsMatch, matches);
        
        return matches;
    }

    // Add this new method to extract base symbol
    private String extractBaseSymbol(String fullSymbol, String type) {
        if (type.equalsIgnoreCase("STOCK")) {
            return fullSymbol.replaceAll("^-", "")  // Remove leading dash
                            .trim()
                            .toUpperCase();
        }
        
        // For options, extract the base symbol
        // Handle different option symbol formats:
        // Format 1: -SPY241220P600 -> SPY
        // Format 2: -SPY 12/20/24 P 600 -> SPY
        // Format 3: -SPY Dec 20 2024 Put 600 -> SPY
        
        // First remove leading dash
        String cleanSymbol = fullSymbol.replaceAll("^-", "");
        
        if (cleanSymbol.contains(" ")) {
            // Handle space-separated format
            return cleanSymbol.split(" ")[0].trim().toUpperCase();
        } else {
            // Handle concatenated format (e.g., SPY241220P600)
            // Extract everything before the first digit
            return cleanSymbol.replaceAll("\\d.*$", "").trim().toUpperCase();
        }
    }

    private boolean isExpiredOption(String description) {
        if (description == null) return false;
        
        String upperDesc = description.toUpperCase().trim();
        logger.debug("Checking for expired option in description: {}", upperDesc);
        
        // Simplified check - just look for "EXPIRED"
        boolean isExpired = upperDesc.startsWith("EXPIRED");
        if (isExpired) {
            logger.info("Found expired option with description: {}", description);
        }
        
        return isExpired;
    }

    private LocalDateTime parseLocalDateTime(String dateStr) {
        try {
            // Define multiple date formats to try
            DateTimeFormatter[] formatters = {
                DateTimeFormatter.ofPattern("M/d/yyyy"),    // Single digit month/day
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),  // Double digit month/day
                DateTimeFormatter.ofPattern("M/dd/yyyy"),   // Single month, double day
                DateTimeFormatter.ofPattern("MM/d/yyyy")    // Double month, single day
            };

            // Try each formatter
            for (DateTimeFormatter formatter : formatters) {
                try {
                    LocalDate date = LocalDate.parse(dateStr.trim(), formatter);
                    return date.atStartOfDay();
                } catch (Exception e) {
                    // Continue to next formatter if this one fails
                    continue;
                }
            }

            // If none of the formatters worked, throw an exception
            logger.error("Could not parse date '{}' with any known format", dateStr);
            throw new CsvImportException("Invalid date format. Expected format: M/D/YYYY or MM/DD/YYYY");

        } catch (Exception e) {
            logger.error("Error parsing date: '{}', Error: {}", dateStr, e.getMessage());
            throw new CsvImportException("Invalid date format. Expected format: M/D/YYYY or MM/DD/YYYY");
        }
    }
} 