const handlePrint = useReactToPrint({
  content: () => invoiceRef.current,
  contentRef: invoiceRef,
});
