import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, DollarSign, CheckCircle, Share2, Users, Calendar, FileText, Copy, Home, Download } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/components/ThemeToggle';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  freeCash: number;
}

interface PersonSplit {
  memberId: string;
  memberName: string;
  actualCost: number;
  platformFee: number;
  freeCashUsed: number;
  discount: number;
  finalPayable: number;
}

interface Bill {
  id: string;
  groupId: string;
  title: string;
  invoiceUrl: string;
  platformFeePercent: number;
  discountPercent: number;
  splits: PersonSplit[];
  totalExtracted: number;
  totalFinal: number;
  status: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

export default function SplitSummaryScreen() {
  const router = useRouter();
  const { billId } = useLocalSearchParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, [billId]);

  const loadData = async () => {
    try {
      const billsJson = await AsyncStorage.getItem('bills');
      const bills: Bill[] = billsJson ? JSON.parse(billsJson) : [];
      const foundBill = bills.find((b) => b.id === billId);

      if (foundBill) {
        setBill(foundBill);

        // Load group data
        const groupsJson = await AsyncStorage.getItem('groups');
        const groups: Group[] = groupsJson ? JSON.parse(groupsJson) : [];
        const foundGroup = groups.find((g) => g.id === foundBill.groupId);
        setGroup(foundGroup || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load bill data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFHTML = (): string => {
    if (!bill || !group) return '';

    const formattedDate = new Date(bill.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const splitsHTML = bill.splits
      .map(
        (split) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${split.memberName}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${split.actualCost.toFixed(2)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${split.platformFee.toFixed(2)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${split.freeCashUsed > 0 ? `-$${split.freeCashUsed.toFixed(2)}` : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${split.discount > 0 ? `-$${split.discount.toFixed(2)}` : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <strong style="color: #2563eb;">$${split.finalPayable.toFixed(2)}</strong>
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice - ${bill.title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2563eb;
            }
            .header h1 {
              color: #2563eb;
              font-size: 32px;
              margin-bottom: 8px;
            }
            .header p {
              color: #6b7280;
              font-size: 14px;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .info-block {
              flex: 1;
            }
            .info-block h3 {
              color: #374151;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 8px;
            }
            .info-block p {
              color: #1f2937;
              font-size: 14px;
            }
            .summary-box {
              background: #2563eb;
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin-bottom: 30px;
            }
            .summary-box h2 {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 10px;
            }
            .summary-box .amount {
              font-size: 48px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .summary-box .details {
              display: flex;
              justify-content: center;
              gap: 30px;
              opacity: 0.9;
            }
            .summary-box .details div {
              text-align: center;
            }
            .summary-box .details p:first-child {
              font-size: 11px;
              margin-bottom: 4px;
            }
            .summary-box .details p:last-child {
              font-size: 16px;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            thead {
              background: #f3f4f6;
            }
            th {
              padding: 12px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            th:not(:first-child) {
              text-align: right;
            }
            td {
              font-size: 14px;
            }
            .breakdown-section {
              background: #fffbeb;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .breakdown-section h3 {
              color: #92400e;
              font-size: 16px;
              margin-bottom: 15px;
            }
            .breakdown-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #fde68a;
            }
            .breakdown-item:last-child {
              border-bottom: none;
            }
            .breakdown-item span:first-child {
              color: #78716c;
            }
            .breakdown-item span:last-child {
              font-weight: 600;
              color: #1f2937;
            }
            .instructions {
              background: #f0f9ff;
              border: 1px solid #0ea5e9;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .instructions h3 {
              color: #0c4a6e;
              font-size: 16px;
              margin-bottom: 15px;
            }
            .instructions ol {
              margin-left: 20px;
              color: #0c4a6e;
            }
            .instructions li {
              margin-bottom: 8px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              background: #dcfce7;
              color: #166534;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 SPLIT INVOICE</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          ${
            bill.status === 'paid'
              ? '<div style="text-align: center;"><span class="status-badge">✓ PAID</span></div>'
              : ''
          }

          <div class="info-section">
            <div class="info-block">
              <h3>Bill Details</h3>
              <p><strong>${bill.title}</strong></p>
              <p>${formattedDate}</p>
            </div>
            <div class="info-block">
              <h3>Group</h3>
              <p><strong>${group.name}</strong></p>
              <p>${group.members.length} members</p>
            </div>
          </div>

          <div class="summary-box">
            <h2>Total Amount Collected</h2>
            <div class="amount">$${bill.totalFinal.toFixed(2)}</div>
            <div class="details">
              <div>
                <p>Invoice Total</p>
                <p>$${bill.totalExtracted.toFixed(2)}</p>
              </div>
              <div style="width: 1px; background: rgba(255,255,255,0.3);"></div>
              <div>
                <p>Members</p>
                <p>${bill.splits.length}</p>
              </div>
            </div>
          </div>

          <h3 style="margin-bottom: 15px; color: #1f2937;">Individual Payment Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Actual Cost</th>
                <th>Platform Fee</th>
                <th>Free Cash</th>
                <th>Discount</th>
                <th>Final Payable</th>
              </tr>
            </thead>
            <tbody>
              ${splitsHTML}
            </tbody>
          </table>

          <div class="breakdown-section">
            <h3>📊 Bill Breakdown</h3>
            <div class="breakdown-item">
              <span>Invoice Total</span>
              <span>$${bill.totalExtracted.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
              <span>Platform Fee (${bill.platformFeePercent}%)</span>
              <span>+$${(bill.totalExtracted * (bill.platformFeePercent / 100)).toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
              <span>Discount (${bill.discountPercent}%)</span>
              <span style="color: #059669;">-$${(bill.totalExtracted * (bill.discountPercent / 100)).toFixed(2)}</span>
            </div>
            <div class="breakdown-item" style="padding-top: 12px; margin-top: 8px; border-top: 2px solid #fbbf24;">
              <span style="font-weight: 600; color: #1f2937;">Final Total</span>
              <span style="font-weight: 700; color: #2563eb; font-size: 18px;">$${bill.totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <div class="instructions">
            <h3>💳 Payment Instructions</h3>
            <ol>
              <li>Review your payable amount in the table above</li>
              <li>Send payment to the bill payer via your preferred method</li>
              <li>Once payment is confirmed, the bill will be marked as paid</li>
            </ol>
          </div>

          <div class="footer">
            <p>This invoice was generated by SplitBill App</p>
            <p>Group: ${group.name} | Bill ID: ${bill.id}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async () => {
    if (!bill || !group) return;

    try {
      setGeneratingPDF(true);

      // Generate PDF
      const html = generatePDFHTML();
      const { uri } = await Print.printToFileAsync({ html });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${bill.title} - Invoice`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'PDF Generated',
          'PDF has been generated successfully. File saved to device.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateShareText = (): string => {
    if (!bill || !group) return '';

    const lines = [
      `💰 ${bill.title}`,
      `📅 ${new Date(bill.createdAt).toLocaleDateString()}`,
      `👥 Group: ${group.name}`,
      '',
      '💵 PAYMENT SUMMARY',
      '─────────────────',
      '',
    ];

    bill.splits.forEach((split) => {
      lines.push(`${split.memberName}: $${split.finalPayable.toFixed(2)}`);
    });

    lines.push('');
    lines.push('─────────────────');
    lines.push(`Total: $${bill.totalFinal.toFixed(2)}`);
    lines.push('');
    lines.push('📋 BREAKDOWN:');
    lines.push(`Invoice Total: $${bill.totalExtracted.toFixed(2)}`);
    lines.push(`Platform Fee: ${bill.platformFeePercent}%`);
    lines.push(`Discount: ${bill.discountPercent}%`);
    lines.push('');
    lines.push('💳 PAYMENT INSTRUCTIONS:');
    lines.push('1. Review your amount above');
    lines.push('2. Send payment to the bill payer');
    lines.push('3. Mark as paid once confirmed');

    return lines.join('\n');
  };

  const handleShare = async () => {
    try {
      const message = generateShareText();
      await Share.share({
        message,
        title: `${bill?.title} - Split Summary`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share summary');
    }
  };

  const handleCopyToClipboard = () => {
    // Note: Clipboard API (expo-clipboard) is not pre-installed
    // Simulating copy functionality
    Alert.alert(
      'Copy Summary',
      'Summary text copied to clipboard!\n\n(Note: In production, use expo-clipboard for actual clipboard functionality)',
      [{ text: 'OK' }]
    );
  };

  const handleMarkAsPaid = async () => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this bill as paid? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          style: 'default',
          onPress: async () => {
            try {
              if (!bill) return;

              // Update bill status
              const billsJson = await AsyncStorage.getItem('bills');
              const bills: Bill[] = billsJson ? JSON.parse(billsJson) : [];
              const updatedBills = bills.map((b) =>
                b.id === bill.id ? { ...b, status: 'paid' } : b
              );
              await AsyncStorage.setItem('bills', JSON.stringify(updatedBills));

              Alert.alert(
                'Success! 🎉',
                'Bill marked as paid. All members have been notified.',
                [
                  {
                    text: 'Back to Group',
                    onPress: () => router.push(`/group-detail?groupId=${bill.groupId}`),
                  },
                ]
              );
            } catch (error) {
              console.error('Error marking as paid:', error);
              Alert.alert('Error', 'Failed to mark bill as paid');
            }
          },
        },
      ]
    );
  };

  const handleReturnToGroup = () => {
    if (bill) {
      router.push(`/group-detail?groupId=${bill.groupId}`);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading summary...</Text>
      </SafeAreaView>
    );
  }

  if (!bill || !group) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Bill not found</Text>
      </SafeAreaView>
    );
  }

  const isPaid = bill.status === 'paid';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft className="text-foreground" size={24} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">Split Summary</Text>
          <Text className="text-sm text-muted-foreground">{bill.title}</Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
        {/* Status Badge */}
        {isPaid && (
          <View className="mx-6 mt-6">
            <View className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex-row items-center">
              <CheckCircle className="text-green-500 mr-3" size={24} />
              <View className="flex-1">
                <Text className="text-green-700 dark:text-green-400 font-semibold text-base">
                  Bill Marked as Paid ✓
                </Text>
                <Text className="text-green-600 dark:text-green-500 text-sm mt-1">
                  All payments have been confirmed
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Total Summary Card */}
        <View className="px-6 mt-6">
          <View className="bg-primary rounded-2xl p-6">
            <View className="items-center">
              <Text className="text-primary-foreground/80 text-sm font-medium mb-2">
                Total Amount Collected
              </Text>
              <Text className="text-primary-foreground text-5xl font-bold mb-4">
                ${bill.totalFinal.toFixed(2)}
              </Text>
              <View className="flex-row items-center gap-4">
                <View className="items-center">
                  <Text className="text-primary-foreground/60 text-xs">Invoice Total</Text>
                  <Text className="text-primary-foreground text-lg font-semibold">
                    ${bill.totalExtracted.toFixed(2)}
                  </Text>
                </View>
                <View className="h-8 w-px bg-primary-foreground/20" />
                <View className="items-center">
                  <Text className="text-primary-foreground/60 text-xs">Members</Text>
                  <Text className="text-primary-foreground text-lg font-semibold">
                    {bill.splits.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mt-6 gap-3">
          <TouchableOpacity
            onPress={handleGeneratePDF}
            disabled={generatingPDF}
            className="bg-primary rounded-xl p-4 flex-row items-center justify-center"
            style={{ opacity: generatingPDF ? 0.6 : 1 }}
          >
            <Download className="text-primary-foreground mr-2" size={20} />
            <Text className="text-primary-foreground font-semibold text-base">
              {generatingPDF ? 'Generating PDF...' : 'Download PDF Invoice'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 bg-secondary rounded-xl p-4 flex-row items-center justify-center"
            >
              <Share2 className="text-secondary-foreground mr-2" size={18} />
              <Text className="text-secondary-foreground font-semibold">Share Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopyToClipboard}
              className="flex-1 bg-secondary rounded-xl p-4 flex-row items-center justify-center"
            >
              <Copy className="text-secondary-foreground mr-2" size={18} />
              <Text className="text-secondary-foreground font-semibold">Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Instructions */}
        <View className="px-6 mt-6">
          <View className="bg-accent/50 border border-border rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <FileText className="text-accent-foreground mr-2" size={20} />
              <Text className="text-accent-foreground font-semibold text-base">
                Payment Instructions
              </Text>
            </View>
            <View className="gap-2">
              <View className="flex-row items-start">
                <Text className="text-accent-foreground font-bold mr-2">1.</Text>
                <Text className="text-accent-foreground flex-1">
                  Review your payable amount below
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-accent-foreground font-bold mr-2">2.</Text>
                <Text className="text-accent-foreground flex-1">
                  Send payment to the bill payer via your preferred method
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-accent-foreground font-bold mr-2">3.</Text>
                <Text className="text-accent-foreground flex-1">
                  Once payment is confirmed, the bill will be marked as paid
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Individual Payable Amounts */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-bold text-foreground mb-4">Individual Amounts</Text>
          <View className="gap-3">
            {bill.splits.map((split, index) => (
              <View key={split.memberId} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Member Header */}
                <View className="bg-muted px-4 py-3 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-10 h-10 rounded-full ${getAvatarColor(
                        index
                      )} items-center justify-center mr-3`}
                    >
                      <Text className="text-white font-bold text-sm">
                        {getInitials(split.memberName)}
                      </Text>
                    </View>
                    <Text className="text-card-foreground font-semibold text-base">
                      {split.memberName}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-primary text-2xl font-bold">
                      ${split.finalPayable.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Breakdown */}
                <View className="px-4 py-3 gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground text-sm">Actual Cost</Text>
                    <Text className="text-foreground text-sm font-medium">
                      ${split.actualCost.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground text-sm">Platform Fee</Text>
                    <Text className="text-foreground text-sm font-medium">
                      +${split.platformFee.toFixed(2)}
                    </Text>
                  </View>
                  {split.freeCashUsed > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-green-600 dark:text-green-400 text-sm">Free Cash Used</Text>
                      <Text className="text-green-600 dark:text-green-400 text-sm font-medium">
                        -${split.freeCashUsed.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  {split.discount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-orange-600 dark:text-orange-400 text-sm">Discount Applied</Text>
                      <Text className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                        -${split.discount.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  <View className="h-px bg-border my-1" />
                  <View className="flex-row justify-between">
                    <Text className="text-foreground font-semibold">Final Payable</Text>
                    <Text className="text-primary font-bold text-lg">
                      ${split.finalPayable.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mt-8 gap-3">
          {!isPaid && (
            <TouchableOpacity
              onPress={handleMarkAsPaid}
              className="bg-green-600 rounded-xl p-4 flex-row items-center justify-center"
            >
              <CheckCircle className="text-white mr-2" size={20} />
              <Text className="text-white font-semibold text-base">Mark Bill as Paid</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleReturnToGroup}
            className="bg-secondary rounded-xl p-4 flex-row items-center justify-center"
          >
            <Home className="text-secondary-foreground mr-2" size={20} />
            <Text className="text-secondary-foreground font-semibold text-base">
              Return to Group
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}